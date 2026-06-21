// Deterministic test for the chunker: proves no content is dropped and that
// consecutive chunks overlap. No network/API calls.
import fs from 'node:fs';

// Load OPENAI_API_KEY before importing summarize.ts (the OpenAI client reads it
// at construction). The key is never used here — chunkText is pure.
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const { chunkText } = await import('../lib/summarize.ts');

// Build a synthetic ~400k-char "paper": 800 tagged paragraphs so we can verify
// every paragraph survives chunking and detect overlap by counting duplicates.
const TOTAL = 800;
const paras: string[] = [];
for (let i = 0; i < TOTAL; i++) {
  const tag = `[[P${String(i).padStart(4, '0')}]]`;
  paras.push(`${tag} ` + 'lorem ipsum dolor sit amet consectetur adipiscing elit. '.repeat(9));
}
const fullText = paras.join('\n\n');

const chunks = chunkText(fullText);

// 1) Coverage — every marker must appear in at least one chunk.
const joined = chunks.join('\n');
const missing: string[] = [];
for (let i = 0; i < TOTAL; i++) {
  const tag = `[[P${String(i).padStart(4, '0')}]]`;
  if (!joined.includes(tag)) missing.push(tag);
}

// 2) Overlap — some markers must appear in more than one chunk.
let duplicated = 0;
for (let i = 0; i < TOTAL; i++) {
  const tag = `[[P${String(i).padStart(4, '0')}]]`;
  const count = chunks.filter((c) => c.includes(tag)).length;
  if (count > 1) duplicated++;
}

// 3) Ordering — first marker in chunk N+1 should not be far ahead of where
//    chunk N ended (i.e. continuity, no skipped span).
const firstTagIndex = (c: string) => {
  const m = c.match(/\[\[P(\d{4})\]\]/);
  return m ? Number(m[1]) : -1;
};
const lastTagIndex = (c: string) => {
  const all = [...c.matchAll(/\[\[P(\d{4})\]\]/g)];
  return all.length ? Number(all[all.length - 1][1]) : -1;
};
let continuous = true;
for (let i = 1; i < chunks.length; i++) {
  // next chunk must start at or before where the previous chunk ended (overlap)
  if (firstTagIndex(chunks[i]) > lastTagIndex(chunks[i - 1]) + 1) continuous = false;
}

console.log(`input chars        : ${fullText.length}`);
console.log(`chunks produced    : ${chunks.length}`);
console.log(`chunk sizes (chars): ${chunks.map((c) => c.length).join(', ')}`);
console.log(`markers total      : ${TOTAL}`);
console.log(`markers missing    : ${missing.length} ${missing.slice(0, 5).join(' ')}`);
console.log(`markers overlapped : ${duplicated}`);
console.log(`continuous coverage: ${continuous}`);

const ok = missing.length === 0 && duplicated > 0 && continuous && chunks.length > 1;
console.log(`\nRESULT: ${ok ? 'PASS ✅' : 'FAIL ❌'}`);
process.exit(ok ? 0 : 1);
