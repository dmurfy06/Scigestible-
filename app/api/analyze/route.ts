import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getUserLimits } from '@/lib/subscription';
import { analyzePaperContent } from '@/lib/summarize';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const limits = await getUserLimits(supabase, user.id);

    // When paperId is present we're digesting a paper that's already in the library,
    // so it doesn't count against the storage limit (it's already stored).
    const { paperText, filename, pdfPath, paperId } = await request.json();

    // Check total paper count for free users — only for brand-new papers
    if (!paperId && limits.paperLimit !== null) {
      const { count } = await supabase
        .from('papers')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if ((count ?? 0) >= limits.paperLimit) {
        return NextResponse.json(
          { error: `Paper limit reached (${limits.paperLimit} papers). Delete a paper to free up space, or upgrade to Pro for unlimited storage.`, code: 'PAPER_LIMIT' },
          { status: 429 }
        );
      }
    }

    // Check daily upload limit
    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await supabase
      .from('daily_usage')
      .select('upload_count, question_count')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if ((usage?.upload_count ?? 0) >= limits.uploadLimit) {
      return NextResponse.json(
        { error: `Daily upload limit reached (${limits.uploadLimit}/day). Your limit resets at midnight.`, code: 'UPLOAD_LIMIT' },
        { status: 429 }
      );
    }

    if (!paperText || paperText.trim().length === 0) {
      return NextResponse.json({ error: 'Paper text is empty' }, { status: 400 });
    }

    if (!paperId && !filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    const analysis = await analyzePaperContent(paperText);

    let saved;
    if (paperId) {
      // Digesting an existing library paper — update its analysis in place
      const { data, error: dbError } = await supabase
        .from('papers')
        .update({ analysis })
        .eq('id', paperId)
        .eq('user_id', user.id)
        .select()
        .single();
      if (dbError || !data) {
        console.error('Failed to update paper analysis:', dbError);
        return NextResponse.json(
          { error: `Digest complete but failed to save: ${dbError?.message ?? 'paper not found'}` },
          { status: 500 }
        );
      }
      saved = data;
    } else {
      const { data, error: dbError } = await supabase
        .from('papers')
        .insert({ user_id: user.id, filename, analysis, pdf_path: pdfPath ?? null })
        .select()
        .single();
      if (dbError) {
        console.error('Failed to save paper to database:', dbError);
        return NextResponse.json(
          { error: `Digest complete but failed to save: ${dbError.message}` },
          { status: 500 }
        );
      }
      saved = data;
    }

    await supabase.from('daily_usage').upsert({
      user_id: user.id,
      date: today,
      upload_count: (usage?.upload_count ?? 0) + 1,
      question_count: usage?.question_count ?? 0,
    }, { onConflict: 'user_id,date' });

    return NextResponse.json({
      id: saved.id,
      filename: saved.filename,
      customName: saved.custom_name ?? undefined,
      pdfPath: saved.pdf_path ?? undefined,
      folderId: saved.folder_id ?? undefined,
      analysis: saved.analysis,
      uploadedAt: new Date(saved.uploaded_at).getTime(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Analysis error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
