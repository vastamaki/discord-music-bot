import { Innertube } from 'youtubei.js';

let youtube: Innertube | null = null;

/**
 * Get or create YouTube client instance
 */
async function getYouTubeClient(): Promise<Innertube> {
  if (!youtube) {
    youtube = await Innertube.create();
  }
  return youtube;
}

/**
 * Service for interacting with YouTube videos using youtubei.js
 */
export const ytdlService = {
  /**
   * Validates if a string is a valid YouTube URL
   */
  validateURL: (url: string): boolean => {
    try {
      const urlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
      return urlPattern.test(url);
    } catch {
      return false;
    }
  },

  /**
   * Extracts the video ID from a YouTube URL
   */
  getVideoID: (url: string): string => {
    // Handle youtu.be format
    const youtubeBePattern = /youtu\.be\/([a-zA-Z0-9_-]{11})/;
    const youtubeBeMatch = url.match(youtubeBePattern);
    if (youtubeBeMatch) {
      return youtubeBeMatch[1];
    }

    // Handle youtube.com format
    const urlObj = new URL(url);
    const videoId = urlObj.searchParams.get('v');

    if (!videoId) {
      throw new Error('Unable to extract video ID from URL');
    }

    return videoId;
  },

  /**
   * Gets video information from YouTube
   */
  getVideoInfo: async (url: string) => {
    const client = await getYouTubeClient();
    const videoId = ytdlService.getVideoID(url);
    return client.getInfo(videoId);
  },

  /**
   * Gets video title from a YouTube URL
   */
  getVideoTitle: async (url: string): Promise<string> => {
    const info = await ytdlService.getVideoInfo(url);
    return info.basic_info.title || '';
  },

  /**
   * Searches YouTube and returns the first result's URL
   */
  search: async (query: string): Promise<string | null> => {
    const client = await getYouTubeClient();
    const results = await client.search(query);
    const firstVideo = results.videos?.[0];

    if (!firstVideo || !('id' in firstVideo) || !firstVideo.id) {
      return null;
    }

    return `https://www.youtube.com/watch?v=${firstVideo.id}`;
  },
};
