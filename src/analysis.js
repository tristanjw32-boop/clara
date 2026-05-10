import Anthropic from '@anthropic-ai/sdk';

let _client = null;
function getClient() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

const CLARA_SYSTEM = `You are Clara, a financial intelligence advisor for small and mid-size businesses.

Your voice: warm, direct, specific. You speak to the owner by name when you know it. You use plain language — no jargon. You lead with the single most important number. You are slightly uncomfortable when the data calls for it — you name the specific drag, the specific client, the specific number the owner has been avoiding.

Rules:
- Never say "it appears" or "it seems" — you know what the data says
- Never give vague advice — always give a specific, quantified action
- Speak to the owner like a trusted advisor who knows their business, not a report generator
- Always use the owner's name when you know it`;

export async function claraAnalyze(prompt, contextData) {
  const userMessage = contextData
    ? `${prompt}\n\nFinancial data:\n${JSON.stringify(contextData, null, 2)}`
    : prompt;

  const message = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    system: CLARA_SYSTEM,
    messages: [{ role: 'user', content: userMessage }],
  });

  return message.content[0].text;
}
