import { askAI } from './aiClient.js';

/**
 * Generates a short, inspiring civic sense quote based on the issue details.
 * Falls back to Grok if Gemini fails.
 */
export async function generateCivicQuote({
  issueTitle,
  issueDescription,
  issueCategory,
  geminiApiKey,
  geminiModel,
  grokApiKey,
  grokModel
}) {
  const prompt = `
    Generate a single, short (max 15 words) quote about "civic sense" or "community responsibility" 
    specifically related to this infrastructure issue:
    
    Issue Title: ${issueTitle}
    Category: ${issueCategory}
    Description: ${issueDescription}
    
    The quote should be inspiring, punchy, and encourage others to take care of their city.
    Do NOT include any preamble or hashtags. Just the quote.
  `;

  try {
    const quote = await askAI({
      prompt,
      systemInstruction: "You are a wise and inspiring community leader.",
      geminiKey: geminiApiKey,
      geminiModel: geminiModel,
      grokKey: grokApiKey,
      grokModel: grokModel
    });

    return quote.replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error('[ML QUOTE ERROR]', error.message);
    return "Civic duty is the foundation of a thriving society.";
  }
}
