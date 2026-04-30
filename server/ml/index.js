import { generateWithGemini } from "./geminiCaptioner.js";
import { mockGenerateDescription } from "./mockCaptioner.js";

export async function generateImageCaption({
  imageUrl,
  imagePath,
  geminiApiKey,
  geminiModel,
  logInfo = () => {},
  logError = () => {}
}) {
  if (!geminiApiKey || !imagePath) {
    return mockGenerateDescription(imageUrl);
  }

  try {
    const caption = await generateWithGemini({ imagePath, geminiApiKey, geminiModel });
    logInfo("Gemini caption generated", { imageUrl });
    return caption;
  } catch (error) {
    logError("Gemini generation failed, falling back to mock description", {
      error: error.message,
      imageUrl
    });
    return mockGenerateDescription(imageUrl);
  }
}
