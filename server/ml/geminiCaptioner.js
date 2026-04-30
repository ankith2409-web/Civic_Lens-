import fs from "node:fs/promises";
import path from "node:path";

function extensionToMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/jpeg";
}

export async function generateWithGemini({ imagePath, geminiApiKey, geminiModel }) {
  const binary = await fs.readFile(imagePath);
  const base64 = binary.toString("base64");
  const mimeType = extensionToMime(imagePath);

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: "Write one clear, human-readable social media caption for this image. Keep it concise, descriptive, and suitable for public posting."
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64
              }
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${text}`);
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}
