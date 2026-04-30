/**
 * Centralized AI Client for CivicLens.
 * Handles primary requests via Gemini and fallbacks to Grok (xAI) if Gemini fails.
 */

export async function askAI({
  prompt,
  systemInstruction = "You are a professional civic advocate and community leader.",
  geminiKey,
  geminiModel = 'gemini-2.0-flash',
  grokKey,
  grokModel = 'grok-beta'
}) {
  // 1. Try Gemini first
  if (geminiKey) {
    try {
      console.log(`[AI-CLIENT] Attempting request with Gemini...`);
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemInstruction}\n\n${prompt}` }] }],
          generationConfig: {
            maxOutputTokens: 512,
            temperature: 0.5
          }
        })
      });

      if (response.ok) {
        const payload = await response.json();
        const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) return text;
      } else {
        const errorText = await response.text();
        console.warn(`[AI-CLIENT] Gemini failed (${response.status}):`, errorText);
      }
    } catch (err) {
      console.error(`[AI-CLIENT] Gemini Exception:`, err.message);
    }
  }

  // 2. Fallback to Grok if Gemini failed or is unavailable
  if (grokKey) {
    try {
      console.log(`[AI-CLIENT] Falling back to Grok (xAI)...`);
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${grokKey}`
        },
        body: JSON.stringify({
          model: grokModel,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
          ],
          temperature: 0.7
        })
      });

      if (response.ok) {
        const payload = await response.json();
        const text = payload?.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      } else {
        const errorText = await response.text();
        console.error(`[AI-CLIENT] Grok failed (${response.status}):`, errorText);
      }
    } catch (err) {
      console.error(`[AI-CLIENT] Grok Exception:`, err.message);
    }
  }

  throw new Error("All AI providers failed to respond.");
}
