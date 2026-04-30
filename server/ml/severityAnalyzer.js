import fs from "node:fs/promises";
import path from "node:path";

function extensionToMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/jpeg";
}

export async function analyzeSeverityWithGemini({ imagePath, geminiApiKey, geminiModel, issueTitle, issueCategory }) {
  const binary = await fs.readFile(imagePath);
  const base64 = binary.toString("base64");
  const mimeType = extensionToMime(imagePath);

  const prompt = `Rate the severity of this infrastructure issue: "${issueTitle}" (${issueCategory}). Respond in JSON: {"score": 1-10, "justification": "max 15 words"}. 1=minor cosmetic, 10=life-threatening.`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 100,
        temperature: 0
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini severity analysis failed: ${response.status} ${text}`);
  }

  const payload = await response.json();
  const rawText = payload?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  
  if (!rawText) {
    throw new Error("Gemini returned an empty response for severity analysis.");
  }

  try {
    return JSON.parse(rawText);
  } catch (err) {
    console.error("Failed to parse Gemini JSON response:", rawText);
    // Fallback if AI doesn't return perfect JSON
    return { score: 5, justification: "Analysis inconclusive (Manual check required)." };
  }
}
