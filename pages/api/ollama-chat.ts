import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, breakevenPerDay, dataSummary, state } = req.body;

  // Validate input
  if (!Array.isArray(messages) || messages.length === 0) {
    console.error('No chat history/messages provided:', messages);
    return res.status(400).json({ error: 'No messages provided.' });
  }

  try {
    // Enhanced system prompt with restaurant-specific guidance
    let systemPrompt = `You are Flavor GPT, an AI assistant specialized in restaurant data analysis and management. You help restaurant owners and managers understand their data, make informed decisions, and optimize their operations.

${dataSummary || ''}

RESPONSE GUIDELINES:
1. Always provide specific, actionable insights based on the restaurant's actual data
2. Use the exact numbers from their data when answering questions
3. Suggest improvements and optimizations when relevant
4. Be conversational but professional
5. If asked to help add data, provide clear instructions on what information is needed
6. When analyzing profitability, consider both revenue and costs
7. For inventory questions, identify items that need restocking
8. For recipe analysis, calculate actual costs and suggest pricing strategies

CAPABILITIES:
- Analyze breakeven points and profitability
- Identify most/least profitable menu items
- Suggest inventory restocking priorities
- Calculate cost per serving for recipes
- Analyze sales trends and patterns
- Provide expense optimization suggestions
- Help with pricing strategies
- Identify operational inefficiencies

EXAMPLE RESPONSES:
- "Your breakeven point is $X per day. To be profitable, you need to generate at least $X in daily revenue."
- "Your most profitable item is [recipe] with a profit margin of X%."
- "You should restock [product] as it's running low (X units remaining)."
- "To add a new recipe, I'll need: ingredients, quantities, and serving size."

Always base your responses on the actual data provided and be specific with numbers and recommendations.`;

    const finalMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    // Use env variable for Ollama host or fall back to localhost
    const ollamaHost = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
    const endpoint = `${ollamaHost}/api/chat`;

    console.log(`Sending request to Ollama at: ${endpoint}`);

    const ollamaRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        messages: finalMessages,
        stream: false, // Disable streaming for simpler response handling
      }),
    });

    if (!ollamaRes.ok) {
      const errorText = await ollamaRes.text();
      console.error(`Ollama returned HTTP ${ollamaRes.status}:`, errorText);
      return res.status(500).json({ error: 'Ollama server returned an error.' });
    }

    const data = await ollamaRes.json();
    const answer = data.message?.content || '';

    if (!answer.trim()) {
      console.error('Ollama API returned an empty answer! Final messages:', finalMessages);
      return res.status(500).json({ error: 'The AI returned no answer.' });
    }

    res.status(200).json({ answer });
  } catch (err) {
    console.error('Ollama API error:', err);
    res.status(500).json({ error: 'Failed to connect to Ollama server.' });
  }
}
