import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { messages, breakevenPerDay, dataSummary } = req.body;
  try {
    let systemPrompt = '';
    if (typeof dataSummary === 'string' && dataSummary.trim().length > 0) {
      systemPrompt = dataSummary;
    } else if (typeof breakevenPerDay === 'number' && !isNaN(breakevenPerDay)) {
      systemPrompt = `The user's breakeven per day is $${breakevenPerDay.toFixed(2)}. Use this value to answer any questions about breakeven, and prefer it over general advice.`;
    }
    const finalMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...(messages || [])]
      : messages;
    const ollamaRes = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        messages: finalMessages,
      }),
    });

    // Read the streaming response
    const reader = ollamaRes.body?.getReader();
    if (!reader) {
      console.error('Ollama API error: No response body from Ollama server.');
      return res.status(500).json({ error: 'No response body from Ollama server.' });
    }
    let fullAnswer = '';
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      // Each chunk may contain multiple JSON lines
      chunk.split('\n').forEach(line => {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              fullAnswer += data.message.content;
            }
          } catch (e) {
            // Ignore parse errors for incomplete lines
          }
        }
      });
    }

    res.status(200).json({ answer: fullAnswer });
  } catch (err) {
    console.error('Ollama API error:', err);
    res.status(500).json({ error: 'Failed to connect to local Ollama server.' });
  }
} 