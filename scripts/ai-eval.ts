#!/usr/bin/env npx tsx
/**
 * Golden-set eval for AI prompts and generated text grounding.
 *
 * Usage: npx tsx scripts/ai-eval.ts
 */
import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const GOLDEN_DIR = path.join(__dirname, '../tests/ai/golden');
const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

type FixtureValue = string | number | boolean | null | FixtureValue[] | { [key: string]: FixtureValue };

interface GoldenCase {
  name?: string;
  input: Record<string, FixtureValue>;
  expected_facts: string[];
  generated_text?: string;
  required_generated_facts?: string[];
  forbidden_generated_claims?: string[];
  eval_prompt?: string;
}

interface GoldenFile {
  label: string;
  fileName: string;
}

interface EvalResult {
  label: string;
  total: number;
  promptInputPassed: number;
  generatedTextPassed: number;
  generatedTextTotal: number;
  failures: string[];
}

const goldenFiles: GoldenFile[] = [
  { label: 'H2H recap', fileName: 'h2h-recap.json' },
  { label: 'Season review', fileName: 'season-review.json' },
];

function normalize(value: string) {
  return value.toLowerCase();
}

function flattenFixtureValue(value: FixtureValue): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenFixtureValue(item));
  }

  if (value && typeof value === 'object') {
    return Object.values(value).flatMap((item) => flattenFixtureValue(item));
  }

  return [String(value ?? '')];
}

function inputContainsFact(input: Record<string, FixtureValue>, fact: string) {
  const normalizedFact = normalize(fact);
  return Object.values(input)
    .flatMap((value) => flattenFixtureValue(value))
    .some((value) => normalize(value).includes(normalizedFact));
}

function textContainsFact(text: string, fact: string) {
  return normalize(text).includes(normalize(fact));
}

function extractText(response: Anthropic.Messages.Message) {
  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  return textBlock.text;
}

function validateGeneratedText(testCase: GoldenCase, text: string) {
  const requiredFacts = testCase.required_generated_facts ?? testCase.expected_facts;
  const missingFacts = requiredFacts.filter((fact) => !textContainsFact(text, fact));
  const forbiddenClaims = testCase.forbidden_generated_claims ?? [];
  const presentForbiddenClaims = forbiddenClaims.filter((claim) => textContainsFact(text, claim));

  return {
    passed: missingFacts.length === 0 && presentForbiddenClaims.length === 0,
    missingFacts,
    presentForbiddenClaims,
  };
}

function loadCases(fileName: string) {
  const raw = fs.readFileSync(path.join(GOLDEN_DIR, fileName), 'utf8');
  return JSON.parse(raw) as GoldenCase[];
}

async function runLiveGeneration(testCase: GoldenCase, client: Anthropic) {
  if (!testCase.eval_prompt) {
    return null;
  }

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 250,
    ...(CLAUDE_MODEL.startsWith('claude-sonnet-5') ? {} : { temperature: 0 }),
    messages: [{ role: 'user', content: testCase.eval_prompt }],
  });

  return extractText(response);
}

async function evaluateFile(goldenFile: GoldenFile, client: Anthropic | null): Promise<EvalResult> {
  const cases = loadCases(goldenFile.fileName);
  const result: EvalResult = {
    label: goldenFile.label,
    total: cases.length,
    promptInputPassed: 0,
    generatedTextPassed: 0,
    generatedTextTotal: 0,
    failures: [],
  };

  for (const testCase of cases) {
    const name = testCase.name ?? goldenFile.fileName;
    const missingInputFacts = testCase.expected_facts.filter(
      (fact) => !inputContainsFact(testCase.input, fact),
    );

    if (missingInputFacts.length === 0) {
      result.promptInputPassed++;
    } else {
      result.failures.push(`${name}: missing prompt input facts: ${missingInputFacts.join(', ')}`);
    }

    let generatedText = testCase.generated_text;
    if (!generatedText && client && testCase.eval_prompt) {
      generatedText = await runLiveGeneration(testCase, client) ?? undefined;
    }

    if (generatedText) {
      result.generatedTextTotal++;
      const generatedTextResult = validateGeneratedText(testCase, generatedText);
      if (generatedTextResult.passed) {
        result.generatedTextPassed++;
      } else {
        const details = [
          generatedTextResult.missingFacts.length
            ? `missing generated facts: ${generatedTextResult.missingFacts.join(', ')}`
            : '',
          generatedTextResult.presentForbiddenClaims.length
            ? `forbidden claims present: ${generatedTextResult.presentForbiddenClaims.join(', ')}`
            : '',
        ].filter(Boolean);
        result.failures.push(`${name}: ${details.join('; ')}`);
      }
    }
  }

  return result;
}

async function main() {
  const client = process.env.ANTHROPIC_API_KEY
    ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    : null;
  const results = await Promise.all(goldenFiles.map((goldenFile) => evaluateFile(goldenFile, client)));
  const failures = results.flatMap((result) => result.failures);

  for (const result of results) {
    console.log(
      `${result.label}: ${result.promptInputPassed}/${result.total} fixture prompt inputs valid`,
    );

    if (result.generatedTextTotal > 0) {
      console.log(
        `${result.label}: ${result.generatedTextPassed}/${result.generatedTextTotal} generated text checks passed`,
      );
    }
  }

  if (!client) {
    console.log('Live generation eval skipped: ANTHROPIC_API_KEY is not set.');
  }

  if (failures.length > 0) {
    console.error('\nFailures:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('AI eval failed:', err);
  process.exit(1);
});
