import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

/**
 * Posts a tweet using the Twitter API v2.
 * If an imagePath is provided, it first uploads the media via the v1 API
 * (as required for image uploads) and attaches the media_id to the v2 tweet.
 * 
 * @param {string} text The content of the tweet
 * @param {string} imagePath Optional absolute path to a local image file
 * @returns {Promise<{ tweetId: string, url: string }>}
 */
export async function postTweet({ text, imagePath }) {
  const {
    TWITTER_API_KEY,
    TWITTER_API_SECRET,
    TWITTER_ACCESS_TOKEN,
    TWITTER_ACCESS_SECRET,
  } = process.env;

  if (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_SECRET) {
    throw new Error('Twitter API credentials are not properly configured in .env');
  }

  // Initialize client with OAuth 1.0a credentials
  const client = new TwitterApi({
    appKey: TWITTER_API_KEY,
    appSecret: TWITTER_API_SECRET,
    accessToken: TWITTER_ACCESS_TOKEN,
    accessSecret: TWITTER_ACCESS_SECRET,
  });

  try {
    let mediaIds = undefined;

    // If there is an image, upload it first using the v1.1 endpoint
    // v2 doesn't yet support media upload endpoint completely
    if (imagePath && fs.existsSync(imagePath)) {
      console.log(`[TWITTER] Uploading media: ${imagePath}`);
      const mediaId = await client.v1.uploadMedia(imagePath);
      mediaIds = [mediaId];
      console.log(`[TWITTER] Media uploaded successfully. Media ID: ${mediaId}`);
    }

    // Post the tweet via v2
    console.log(`[TWITTER] Posting tweet...`);
    const { data } = await client.v2.tweet(text, {
      media: mediaIds ? { media_ids: mediaIds } : undefined
    });

    console.log(`[TWITTER] Tweet posted successfully! ID: ${data.id}`);

    // Construct the public URL of the tweet using the user's handle from the access token 
    // or fallback to the general status URL structure
    return {
      tweetId: data.id,
      url: `https://twitter.com/i/web/status/${data.id}`,
      text: data.text
    };
  } catch (error) {
    console.error('[TWITTER POST ERROR]', error);
    // Twitter API errors usually have detailed messages in error.data
    const msg = error?.data?.detail || error.message || 'Unknown Twitter error';
    throw new Error(`Failed to post to X: ${msg}`);
  }
}
