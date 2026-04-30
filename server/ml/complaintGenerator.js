import { askAI } from './aiClient.js';

/**
 * Generates a formal complaint email using Gemini AI or Grok fallback.
 */
export async function generateComplaintEmail({ 
  issueTitle, 
  issueDescription, 
  issueCategory, 
  issueAddress, 
  verificationScore, 
  department, 
  geminiApiKey, 
  geminiModel,
  grokApiKey,
  grokModel
}) {
  const prompt = `Write a formal, authoritative, and persuasive complaint email to the ${department} regarding a verified infrastructure issue.

Issue Details:
- Title: ${issueTitle}
- Category: ${issueCategory}
- Description: ${issueDescription}
- Location: ${issueAddress}
- Community Verification Score: ${verificationScore} (Higher means more residents have confirmed the issue)

The tone should be professional, firm, and urgent. Mention that this issue represents a failure to maintain public standards and accessibility, and request a specific resolution timeline or ticket number.

Respond ONLY with the text of the email. Do not include subject lines or placeholders like [Your Name]. Use "Concerned Citizens of the District" as the sign-off.`;

  try {
    return await askAI({
      prompt,
      systemInstruction: "You are a professional civic advocate and community leader.",
      geminiKey: geminiApiKey,
      geminiModel: geminiModel,
      grokKey: grokApiKey,
      grokModel: grokModel
    });
  } catch (error) {
    console.error("[COMPLAINT GENERATOR ERROR]", error.message);
    return mockComplaintEmail({ issueTitle, issueDescription, issueAddress, verificationScore, department });
  }
}

function mockComplaintEmail({ issueTitle, issueDescription, issueAddress, verificationScore, department }) {
  return `To: ${department} Complaints Department
Subject: URGENT: Broken Public Amenity - ${issueTitle}

Sir/Madam,

I am writing to formally report a critical issue regarding public infrastructure under your administration. 

Issue: ${issueTitle}
Location: ${issueAddress}
Community Verification: This issue has a verification score of ${verificationScore} on the CivicLens platform, indicating significant community concern.

Field Notes:
"${issueDescription}"

As this represents a significant hazard and disruption to public accessibility, we urge immediate rectification. Please provide a resolution timeline or ticket number for tracking purposes.

Sincerely,
Concerned Citizens of the District`;
}
