import Anthropic from '@anthropic-ai/sdk';

export interface ClaudeOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_MAX_TOKENS = 1500;
const DEFAULT_TEMPERATURE = 0.8;

/**
 * Generate text using Claude API
 */
export async function generateWithClaude(
  prompt: string,
  options: ClaudeOptions = {}
): Promise<{ text: string; model: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  const client = new Anthropic({ apiKey });
  const model = options.model || DEFAULT_MODEL;

  const response = await client.messages.create({
    model,
    max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
    temperature: options.temperature || DEFAULT_TEMPERATURE,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  // Extract text from response
  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  return {
    text: textBlock.text,
    model: response.model,
  };
}
