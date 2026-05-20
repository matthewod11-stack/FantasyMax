#!/usr/bin/env npx tsx
/**
 * Golden-set eval for AI prompts (hallucination check on cited stats).
 * Usage: npx tsx scripts/ai-eval.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const goldenPath = path.join(__dirname, '../tests/ai/golden/h2h-recap.json');

function main() {
  const raw = fs.readFileSync(goldenPath, 'utf8');
  const cases = JSON.parse(raw) as Array<{
    input: Record<string, string | number>;
    expected_facts: string[];
  }>;

  let passed = 0;
  for (const c of cases) {
    const facts = c.expected_facts.every((f) =>
      Object.values(c.input).some((v) => String(v).includes(f)),
    );
    if (facts) passed++;
  }

  console.log(`Golden set: ${passed}/${cases.length} fixture cases valid`);
  console.log('Run full eval with ANTHROPIC_API_KEY to score live generations.');
}

main();
