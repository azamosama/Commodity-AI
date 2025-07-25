import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, breakevenPerDay, dataSummary } = req.body;

  // Validate input
  if (!Array.isArray(messages) || messages.length === 0) {
    console.error('No chat history/messages provided:', messages);
    return res.status(400).json({ error: 'No messages provided.' });
  }

  try {
    let systemPrompt = '';
    if (typeof dataSummary === 'string' && dataSummary.trim().length > 0) {
      systemPrompt = dataSummary;
    } else if (typeof breakevenPerDay === 'number' && !isNaN(breakevenPerDay)) {
      systemPrompt = `The user's breakeven per day is $${breakevenPerDay.toFixed(2)}. Use this value to answer any questions about breakeven, and prefer it over general advice.`;
    }

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
      }),
    });

    if (!ollamaRes.ok) {
      const errorText = await ollamaRes.text();
      console.error(`Ollama returned HTTP ${ollamaRes.status}:`, errorText);
      return res.status(500).json({ error: 'Ollama server returned an error.' });
    }

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
      chunk.split('\n').forEach(line => {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) fullAnswer += data.message.content;
          } catch (e) {
            console.warn('Could not parse Ollama chunk line:', line, e);
          }
        }
      });
    }

    if (!fullAnswer.trim()) {
      console.error('Ollama API returned an empty answer! Final messages:', finalMessages);
      return res.status(500).json({ error: 'The AI returned no answer.' });
    }

    res.status(200).json({ answer: fullAnswer });
  } catch (err) {
    console.error('Ollama API error:', err);
    res.status(500).json({ error: 'Failed to connect to Ollama server.' });
  }
}
