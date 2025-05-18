// index.js (Vercel Serverless Function)

// import fetch from 'node-fetch'; // এই লাইনটি বাদ দেওয়া হয়েছে

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
  }

  try {
    // 1️⃣ GEMINI API CALL
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyDOA5_BiQGD_iG0_vg6q7ybS9loQ3O8tNs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500
        }
      })
    });

    const geminiData = await geminiRes.json();

    if (!geminiData?.candidates?.length) {
      // 2️⃣ FALLBACK TO OpenRouter API (Mistral)
      const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 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'
        },
        body: JSON.stringify({
          model: 'mistral/mistral-7b-instruct',
          messages: [{ role: 'user', content: message }]
        })
      });

      const openRouterData = await openRouterRes.json();
      const fallbackText = openRouterData?.choices?.[0]?.message?.content || 'Sorry, fallback failed.';

      return res.status(200).json({ reply: fallbackText });
    }

    const geminiReply = geminiData.candidates[0].content.parts[0].text;
    return res.status(200).json({ reply: geminiReply });

  } catch (error) {
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}