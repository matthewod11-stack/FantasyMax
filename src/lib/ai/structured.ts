import { z } from 'zod';
import { generateWithClaude } from './claude';

export interface StructuredOutputOptions<T extends z.ZodType> {
  schema: T;
  prompt: string;
  model?: string;
  maxTokens?: number;
}

export async function generateStructured<T extends z.ZodType>(
  options: StructuredOutputOptions<T>,
): Promise<z.infer<T>> {
  const fullPrompt = `${options.prompt}

Respond with ONLY valid JSON (no markdown fences).`;

  const { text } = await generateWithClaude(fullPrompt, {
    model: options.model,
    maxTokens: options.maxTokens ?? 800,
    temperature: 0.5,
  });

  const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
  const parsed = JSON.parse(cleaned);
  return options.schema.parse(parsed);
}

export const recapOutputSchema = z.object({
  headline: z.string(),
  summary: z.string(),
  cited_stats: z.array(z.string()),
});

export const trashTalkSchema = z.object({
  message: z.string(),
  cited_stats: z.array(z.string()),
});
