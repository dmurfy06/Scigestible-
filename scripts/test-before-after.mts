// Live before/after test. Builds a paper with critical facts placed AFTER the
// old 20,000-char truncation point, then compares:
//   BEFORE = old behaviour (truncate to 20k chars, single pass)
//   AFTER  = new pipeline (full text + verification re-read)
// and checks which one captures the late-section facts.
import fs from 'node:fs';

for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const { analyzePaperContent } = await import('../lib/summarize.ts');
const OpenAI = (await import('openai')).default;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Build the synthetic paper ────────────────────────────────────────────────
const header = `Metformin plus structured exercise in early type 2 diabetes: the LEEDS-MOVE randomised controlled trial
Authors: Okafor, Chidi A.; Brennan, Sarah; Vasquez, Diego L.
Journal of Clinical Metabolic Research, 2024, vol. 18, issue 2, pages 211-229. doi:10.1099/jcmr.2024.0182

ABSTRACT
We tested whether adding a structured exercise programme to standard metformin therapy improves glycaemic control in adults newly diagnosed with type 2 diabetes.

INTRODUCTION
Type 2 diabetes affects roughly 460 million adults worldwide. Standard first-line therapy is metformin, but glycaemic control often drifts within two years of diagnosis.
`;

// Padding to push the key Results section past the 20,000-char mark, mimicking
// a long methods/background section.
const pad =
  'BACKGROUND AND METHODS. Participants attended the Leeds metabolic clinic for baseline assessment including fasting glucose, HbA1c, blood pressure, and a graded treadmill test. ' +
  'Randomisation used a computer-generated sequence stratified by age and baseline HbA1c. The exercise arm completed three supervised sessions weekly for 24 weeks. ';
let body = header + pad.repeat(95); // ~21k chars of lead-in

const offset = body.length;

// Critical late-section facts — these sit AFTER char 20,000.
body += `

RESULTS
At 24 weeks, the exercise-plus-metformin group showed a 41% reduction in the relapse of poor glycaemic control compared with metformin alone (hazard ratio 0.59, 95% confidence interval 0.44 to 0.79, p=0.002).
Mean HbA1c fell by 1.3 percentage points in the intervention group versus 0.4 points in controls.
Systolic blood pressure dropped 7 mmHg more in the intervention group.

LIMITATIONS
The trial enrolled only 84 participants, all recruited from a single hospital in Leeds, which limits generalisability.
Outcomes relied partly on self-reported activity logs. Two authors received speaker fees from the metformin manufacturer.

CONCLUSION
Adding supervised exercise to metformin meaningfully improved glycaemic control over 24 weeks in this small single-site trial.
`;

console.log(`paper length        : ${body.length} chars`);
console.log(`key result at index : ${body.indexOf('41% reduction')} (old cutoff = 20000)`);
console.log(`=> late facts are ${body.indexOf('41% reduction') > 20000 ? 'AFTER' : 'BEFORE'} the old truncation point\n`);

// ── BEFORE: replicate the old truncation ─────────────────────────────────────
async function oldAnalyze(text: string) {
  const truncated = text.substring(0, 20000);
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You are a science communicator. Summarise the paper as JSON.' },
      {
        role: 'user',
        content: `Paper:\n---\n${truncated}\n---\nReturn JSON: {"plainEnglishSummary":{"text":""},"keyFindings":[{"text":""}],"limitations":[{"text":""}]}`,
      },
    ],
  });
  return JSON.parse(res.choices[0].message.content!);
}

const probes = ['41%', '0.59', '1.3', '84', 'Leeds'];
const found = (s: string) => probes.filter((p) => s.includes(p));

console.log('Running BEFORE (old 20k truncation)…');
const before = await oldAnalyze(body);
const beforeStr = JSON.stringify(before);

console.log('Running AFTER (new full-text pipeline)…');
const after = await analyzePaperContent(body);
const afterStr = JSON.stringify(after);

console.log('\n──────── BEFORE (truncated) ────────');
console.log('Summary:', before.plainEnglishSummary?.text);
console.log('Findings:', (before.keyFindings ?? []).map((f: any) => f.text));
console.log('Limitations:', (before.limitations ?? []).map((l: any) => l.text));
console.log('Late facts captured:', found(beforeStr).join(', ') || 'NONE');

console.log('\n──────── AFTER (full pipeline) ────────');
console.log('Summary:', after.plainEnglishSummary.text);
console.log('Findings:', after.keyFindings.map((f) => f.text));
console.log('Limitations:', after.limitations.map((l) => l.text));
console.log('Citation:', after.citationData?.title, '—', after.citationData?.authors?.join('; '));
console.log('Late facts captured:', found(afterStr).join(', ') || 'NONE');

const pass = found(beforeStr).length < found(afterStr).length && found(afterStr).length >= 3;
console.log(`\nRESULT: ${pass ? 'PASS ✅  (new pipeline recovers facts the old one dropped)' : 'FAIL ❌'}`);
process.exit(pass ? 0 : 1);
