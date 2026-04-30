# ML Caption Module

This folder contains the machine-learning caption generation logic used by the backend.

## Files

- `index.js`: Main entry point for caption generation.
- `geminiCaptioner.js`: Gemini API-based image-to-caption generation.
- `mockCaptioner.js`: Local fallback caption generator.

## Environment Variables

- `GEMINI_API_KEY`: API key for Gemini.
- `GEMINI_MODEL`: Model name (default: `gemini-1.5-flash`).

## Integration

The backend service `src/services/aiService.js` delegates caption generation to this folder.

## Download

You can download either:

- the full `ml` folder, or
- `ml-folder.zip` (created at project root).
