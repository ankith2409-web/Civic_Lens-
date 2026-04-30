import fs from "node:fs/promises";
import path from "node:path";

function extensionToMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/jpeg";
}

/**
 * Analyzes an image using Gemini and returns tweet-ready content
 * including a description, hashtags, and location context.
 */
export async function analyzeImageForTweet({ imagePath, geminiApiKey, geminiModel, issueTitle, issueCategory, issueAddress }) {
  if (!geminiApiKey || !imagePath) {
    return mockAnalyzeForTweet({ issueTitle, issueCategory, issueAddress });
  }

  try {
    const binary = await fs.readFile(imagePath);
    const base64 = binary.toString("base64");
    const mimeType = extensionToMime(imagePath);

    const prompt = `You are CivicLens, a civic infrastructure monitoring platform. Analyze this image of a reported civic issue and generate content for a tweet/post on X (Twitter).

Issue Context:
- Title: ${issueTitle || "Civic Infrastructure Issue"}
- Category: ${issueCategory || "General"}
- Reported Location: ${issueAddress || "Unknown"}

Respond ONLY with a valid JSON object (no markdown, no code fences) in this exact format:
{
  "description": "A concise 1-2 sentence civic awareness caption about what you see in the image. Be specific about the infrastructure problem. Keep it under 200 characters.",
  "hashtags": ["#CivicLens", "#GhostInfrastructure", "3-5 more relevant hashtags based on the image and category"],
  "locationContext": "A brief phrase about the location based on visual cues in the image and the provided address"
}`;

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
          maxOutputTokens: 300,
          temperature: 0.5
        }
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Gemini request failed: ${response.status} ${text}`);
    }

    const payload = await response.json();
    const rawText = payload?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!rawText) {
      throw new Error("Gemini returned an empty response.");
    }

    // Parse the JSON response, stripping any markdown code fences if present
    const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleanJson);

    return {
      description: result.description || "Civic infrastructure issue reported via CivicLens.",
      hashtags: result.hashtags || ["#CivicLens", "#GhostInfrastructure"],
      locationContext: result.locationContext || issueAddress || "Location not available"
    };
  } catch (error) {
    console.error("[TWEET ANALYZER ERROR]", error.message);
    return mockAnalyzeForTweet({ issueTitle, issueCategory, issueAddress });
  }
}

/**
 * Fallback mock analyzer when Gemini API is unavailable
 */
function mockAnalyzeForTweet({ issueTitle, issueCategory, issueAddress }) {
  const categoryHashtags = {
    RAMP: ["#Accessibility", "#WheelchairAccess", "#DisabilityRights"],
    FOUNTAIN: ["#WaterAccess", "#PublicUtilities"],
    BENCH: ["#PublicSpaces", "#UrbanDesign"],
    STREETLIGHT: ["#StreetSafety", "#PublicLighting", "#NightSafety"],
    TOILET: ["#Sanitation", "#PublicHealth", "#Hygiene"],
    OTHER: ["#UrbanInfrastructure", "#CityMaintenance"]
  };

  const extraTags = categoryHashtags[issueCategory] || categoryHashtags.OTHER;

  return {
    description: `⚠️ ${issueTitle || "Infrastructure issue"} reported at ${issueAddress || "an undisclosed location"}. This needs urgent civic attention!`,
    hashtags: ["#CivicLens", "#GhostInfrastructure", ...extraTags],
    locationContext: issueAddress || "Location not specified"
  };
}
