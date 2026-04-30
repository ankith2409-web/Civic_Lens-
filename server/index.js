import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { generateImageCaption } from './ml/index.js';
import { analyzeImageForTweet } from './ml/tweetAnalyzer.js';
import { postTweet } from './ml/tweetPoster.js';
import { generateComplaintEmail } from './ml/complaintGenerator.js';
import { analyzeSeverityWithGemini } from './ml/severityAnalyzer.js';
import { generateCivicQuote } from './ml/quoteGenerator.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3005;

// Setup temporary upload directory
// Vercel only allows writing to /tmp
const isVercel = process.env.VERCEL === '1';
const uploadDir = isVercel ? '/tmp/' : 'uploads/';

if (!isVercel && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const upload = multer({ dest: uploadDir });

app.use(cors());
app.use(express.json());

// API route to generate captions using Gemini
app.post('/api/caption', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    const imagePath = req.file.path;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    console.log(`[ML] Generating caption for uploaded image: ${req.file.originalname}`);
    
    const caption = await generateImageCaption({
      imageUrl: '', // For fallback if needed
      imagePath,
      geminiApiKey,
      geminiModel,
      logInfo: (msg, data) => console.log(`[ML INFO] ${msg}`, data || ''),
      logError: (msg, data) => console.error(`[ML ERROR] ${msg}`, data || '')
    });

    // Cleanup uploaded file after processing
    fs.unlink(imagePath, (err) => {
      if (err) console.error(`Failed to delete temp file ${imagePath}:`, err);
    });

    res.json({ caption });
  } catch (error) {
    console.error('[SERVER ERROR]', error);
    res.status(500).json({ error: 'Failed to generate image caption.' });
  }
});

// API route to analyze image severity using Gemini
app.post('/api/analyze-severity', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    const { title, category } = req.body;
    const imagePath = req.file.path;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    console.log(`[ML] Analyzing severity for: ${title}`);
    
    const analysis = await analyzeSeverityWithGemini({
      imagePath,
      geminiApiKey,
      geminiModel,
      issueTitle: title,
      issueCategory: category
    });

    // Cleanup uploaded file after processing
    fs.unlink(imagePath, (err) => {
      if (err) console.error(`Failed to delete temp file ${imagePath}:`, err);
    });

    res.json(analysis);
  } catch (error) {
    console.error('[SERVER ERROR SEVERITY]', error);
    res.status(500).json({ error: 'Failed to analyze issue severity.' });
  }
});

// API route to analyze an image and generate tweet-ready content
app.post('/api/analyze-for-share', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    const imagePath = req.file.path;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    // Extract issue metadata from the request body
    const { title, category, address } = req.body;

    console.log(`[SHARE] Analyzing image for tweet: ${req.file.originalname}`);
    console.log(`[SHARE] Issue context: title="${title}", category="${category}", address="${address}"`);

    const result = await analyzeImageForTweet({
      imagePath,
      geminiApiKey,
      geminiModel,
      issueTitle: title,
      issueCategory: category,
      issueAddress: address
    });

    // Cleanup uploaded file after processing
    fs.unlink(imagePath, (err) => {
      if (err) console.error(`Failed to delete temp file ${imagePath}:`, err);
    });

    console.log(`[SHARE] Analysis complete:`, result);
    res.json(result);
  } catch (error) {
    console.error('[SERVER ERROR]', error);
    res.status(500).json({ error: 'Failed to analyze image for sharing.' });
  }
});

// API route to post a tweet to X (Twitter) via the backend
app.post('/api/post-to-x', upload.single('image'), async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Tweet text is required.' });
    }

    const imagePath = req.file ? req.file.path : null;

    console.log(`[POST-TO-X] Posting tweet...`);
    console.log(`[POST-TO-X] Text: ${text.substring(0, 80)}...`);
    if (imagePath) console.log(`[POST-TO-X] With image: ${req.file.originalname}`);

    const result = await postTweet({ text, imagePath });

    // Cleanup uploaded file after posting
    if (imagePath) {
      fs.unlink(imagePath, (err) => {
        if (err) console.error(`Failed to delete temp file ${imagePath}:`, err);
      });
    }

    console.log(`[POST-TO-X] Success! Tweet URL: ${result.url}`);
    res.json({ success: true, tweetId: result.tweetId, url: result.url });
  } catch (error) {
    console.error('[POST-TO-X ERROR]', error.message);
    res.status(500).json({ error: error.message || 'Failed to post tweet.' });
  }
});

// API route to generate a formal complaint email using Gemini
app.post('/api/generate-complaint', async (req, res) => {
  try {
    const { title, description, category, address, verificationScore, department } = req.body;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    console.log(`[COMPLAINT] Generating AI draft for: ${title}`);

    const draft = await generateComplaintEmail({
      issueTitle: title,
      issueDescription: description,
      issueCategory: category,
      issueAddress: address,
      verificationScore,
      department,
      geminiApiKey,
      geminiModel,
      grokApiKey: process.env.GROK_API_KEY,
      grokModel: process.env.GROK_MODEL || 'grok-beta'
    });

    res.json({ draft });
  } catch (error) {
    console.error('[COMPLAINT ERROR]', error);
    res.status(500).json({ error: 'Failed to generate complaint draft.' });
  }
});

// API route to generate a civic sense quote using Gemini
app.post('/api/generate-quote', async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    console.log(`[ML] Generating civic quote for: ${title}`);

    const quote = await generateCivicQuote({
      issueTitle: title,
      issueDescription: description,
      issueCategory: category,
      geminiApiKey,
      geminiModel,
      grokApiKey: process.env.GROK_API_KEY,
      grokModel: process.env.GROK_MODEL || 'grok-beta'
    });

    res.json({ quote });
  } catch (error) {
    console.error('[QUOTE API ERROR]', error);
    res.status(500).json({ error: 'Failed to generate civic quote.' });
  }
});

// Export for Vercel
export default app;

// Only listen if not running as a serverless function
if (!isVercel) {
  app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
    console.log(`ML Module Loaded successfully. Waiting for requests...`);
  });
}
