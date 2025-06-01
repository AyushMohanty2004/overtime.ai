import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with your API key
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

// Real YouTube API implementation
const youtubeSearch = async (keywords: string[]) => {
  try {
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    
    console.log('YouTube search keywords:', keywords);
    console.log('YouTube API key exists:', !!YOUTUBE_API_KEY);
    
    if (!YOUTUBE_API_KEY) {
      console.warn('YouTube API key not found, falling back to mock data');
      return mockYouTubeSearch(keywords);
    }
    
    // Combine keywords for search query
    const searchQuery = keywords.join(' ');
    
    // Make request to YouTube Data API
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(searchQuery)}+tutorial+education&type=video&relevanceLanguage=en&videoDuration=medium&key=${YOUTUBE_API_KEY}`,
      { method: 'GET' }
    );
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.items;
  } catch (error) {
    console.error('Error fetching from YouTube API:', error);
    // Fall back to mock data if API fails
    return mockYouTubeSearch(keywords);
  }
};

// Mock YouTube API as fallback
const mockYouTubeSearch = async (keywords: string[]) => {
  // Return mock results based on keywords
  return [
    {
      id: { videoId: 'dQw4w9WgXcQ' },
      snippet: {
        title: `Learn about ${keywords[0]} - Educational Video`,
        description: `This video covers ${keywords.join(', ')} and related concepts in detail.`,
        channelTitle: 'Educational Channel',
        publishedAt: '2023-01-01T00:00:00Z',
        thumbnails: {
          medium: {
            url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg'
          }
        }
      }
    },
    {
      id: { videoId: 'xvFZjo5PgG0' },
      snippet: {
        title: `${keywords[1]} Tutorial for Beginners`,
        description: `A comprehensive tutorial on ${keywords[1]} for beginners.`,
        channelTitle: 'Tutorial Channel',
        publishedAt: '2023-02-01T00:00:00Z',
        thumbnails: {
          medium: {
            url: 'https://i.ytimg.com/vi/xvFZjo5PgG0/mqdefault.jpg'
          }
        }
      }
    },
    {
      id: { videoId: 'jNQXAC9IVRw' },
      snippet: {
        title: `Advanced ${keywords[2]} Techniques`,
        description: `This video explores advanced techniques in ${keywords[2]}.`,
        channelTitle: 'Advanced Learning',
        publishedAt: '2023-03-01T00:00:00Z',
        thumbnails: {
          medium: {
            url: 'https://i.ytimg.com/vi/jNQXAC9IVRw/mqdefault.jpg'
          }
        }
      }
    }
  ];
};

// Web search API implementation with multiple options
const webSearch = async (keywords: string[]) => {
  try {
    // Check which search API keys are available
    const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
    const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
    const BING_SEARCH_API_KEY = process.env.BING_SEARCH_API_KEY;
    const SERPER_API_KEY = process.env.SERPER_API_KEY;
    
    console.log('Web search keywords:', keywords);
    console.log('Google Search API key exists:', !!GOOGLE_SEARCH_API_KEY);
    console.log('Google Search Engine ID exists:', !!GOOGLE_SEARCH_ENGINE_ID);
    console.log('Bing Search API key exists:', !!BING_SEARCH_API_KEY);
    console.log('Serper API key exists:', !!SERPER_API_KEY);
    
    // Combine keywords for search query
    const searchQuery = keywords.join(' ') + ' tutorial guide learn';
    
    if (GOOGLE_SEARCH_API_KEY && GOOGLE_SEARCH_ENGINE_ID) {
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(searchQuery)}&num=5`,
        { method: 'GET' }
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.items.map((item: any) => ({
          title: item.title,
          url: item.link,
          snippet: item.snippet
        }));
      }
    }
    
    // Try Bing Search if available
    if (BING_SEARCH_API_KEY) {
      const response = await fetch(
        `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(searchQuery)}&count=5&responseFilter=Webpages`,
        { 
          method: 'GET',
          headers: {
            'Ocp-Apim-Subscription-Key': BING_SEARCH_API_KEY
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.webPages.value.map((item: any) => ({
          title: item.name,
          url: item.url,
          snippet: item.snippet
        }));
      }
    }
    
    // Try Serper.dev if available
    if (SERPER_API_KEY) {
      const response = await fetch(
        'https://google.serper.dev/search',
        {
          method: 'POST',
          headers: {
            'X-API-KEY': SERPER_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            q: searchQuery,
            num: 5
          })
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.organic.map((item: any) => ({
          title: item.title,
          url: item.link,
          snippet: item.snippet
        }));
      }
    }
    
    // If all APIs fail or no keys are configured, fall back to mock data
    console.warn('No search API keys configured or all APIs failed, falling back to mock data');
    return mockWebSearch(keywords);
  } catch (error) {
    console.error('Error fetching from web search APIs:', error);
    // Fall back to mock data if all APIs fail
    return mockWebSearch(keywords);
  }
};

// Mock web search as fallback
const mockWebSearch = async (keywords: string[]) => {
  // Return mock results based on keywords
  return [
    {
      title: `Understanding ${keywords[0]}: A Comprehensive Guide`,
      url: 'https://example.com/article1',
      snippet: `This article provides a comprehensive guide to ${keywords[0]} and its applications.`
    },
    {
      title: `${keywords[1]}: From Basics to Advanced Concepts`,
      url: 'https://example.com/article2',
      snippet: `Learn about ${keywords[1]} from the basics to advanced concepts in this detailed article.`
    },
    {
      title: `Practical Applications of ${keywords[2]}`,
      url: 'https://example.com/article3',
      snippet: `Discover the practical applications of ${keywords[2]} in various fields.`
    }
  ];
};

// Function to filter resources using Gemini
async function filterResourcesWithAI(
  resources: any[],
  moduleTitle: string,
  moduleDescription: string,
  resourceType: 'youtube' | 'article'
) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const resourcesJson = JSON.stringify(resources);
    
    const prompt = `
    You are an expert educational content curator. Your task is to evaluate and select the most relevant and high-quality ${resourceType === 'youtube' ? 'YouTube videos' : 'web articles'} for a specific learning module.

    MODULE TITLE: ${moduleTitle}
    MODULE DESCRIPTION: ${moduleDescription}

    Here are the available ${resourceType === 'youtube' ? 'videos' : 'articles'} to evaluate:
    ${resourcesJson}

    For each resource, determine:
    1. How relevant it is to the module topic (high, medium, low)
    2. How well it would help a learner understand the module concepts
    3. A brief justification for why this resource would be valuable to include (or why it should be excluded)

    Select the 2 most appropriate resources and return them in the following JSON format:
    [
      {
        ${resourceType === 'youtube' ? '"videoId": "video_id",' : '"url": "article_url",'}
        "title": "Resource title",
        "aiJustification": "Your justification for including this resource"
      },
      ...
    ]

    Only return the JSON array, nothing else.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      // Find JSON in the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(text);
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      throw new Error('Failed to parse AI resource filtering response');
    }
  } catch (error) {
    console.error('Error filtering resources with AI:', error);
    throw error;
  }
}

// Main handler function
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { moduleId, moduleTitle, moduleDescription, searchKeywords } = req.body;

    console.log('API request received:', { moduleId, moduleTitle, searchKeywords });

    if (!moduleId || !moduleTitle || !moduleDescription || !searchKeywords) {
      console.log('Missing required parameters:', { moduleId, moduleTitle, moduleDescription, searchKeywords });
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Fetch YouTube videos
    console.log('Fetching YouTube videos for keywords:', searchKeywords);
    const youtubeResults = await youtubeSearch(searchKeywords);
    console.log('YouTube results count:', youtubeResults?.length || 0);
    
    // Fetch web articles
    console.log('Fetching web articles for keywords:', searchKeywords);
    const articleResults = await webSearch(searchKeywords);
    console.log('Article results count:', articleResults?.length || 0);
    
    // Filter YouTube videos with AI
    console.log('Filtering YouTube videos with AI...');
    let filteredVideos = [];
    try {
      filteredVideos = await filterResourcesWithAI(
        youtubeResults,
        moduleTitle,
        moduleDescription,
        'youtube'
      );
      console.log('Filtered videos count:', filteredVideos?.length || 0);
    } catch (error) {
      console.error('Error filtering videos:', error);
      // Use mock data if AI filtering fails
      filteredVideos = youtubeResults.slice(0, 2).map((video: any) => ({
        videoId: video.id?.videoId || 'dQw4w9WgXcQ',
        title: video.snippet?.title || 'Mock Video Title',
        aiJustification: 'This video appears to be relevant to your learning module.'
      }));
      console.log('Using mock filtered videos as fallback');
    }
    
    // Filter articles with AI
    console.log('Filtering articles with AI...');
    let filteredArticles = [];
    try {
      filteredArticles = await filterResourcesWithAI(
        articleResults,
        moduleTitle,
        moduleDescription,
        'article'
      );
      console.log('Filtered articles count:', filteredArticles?.length || 0);
    } catch (error) {
      console.error('Error filtering articles:', error);
      // Use mock data if AI filtering fails
      filteredArticles = articleResults.slice(0, 2).map((article: any) => ({
        url: article.link || 'https://example.com',
        title: article.title || 'Mock Article Title',
        aiJustification: 'This article appears to be relevant to your learning module.'
      }));
      console.log('Using mock filtered articles as fallback');
    }
    
    // Format the final resources
    console.log('Formatting resources...');
    const formattedVideos = filteredVideos.map((video: any) => ({
      id: `video-${moduleId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: 'youtube',
      title: video.title,
      videoId: video.videoId,
      aiJustification: video.aiJustification,
      watched: false
    }));
    
    const formattedArticles = filteredArticles.map((article: any) => ({
      id: `article-${moduleId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: 'article',
      title: article.title,
      url: article.url,
      aiJustification: article.aiJustification,
      read: false
    }));
    
    // Combine all resources
    const allResources = [...formattedVideos, ...formattedArticles];
    
    console.log('Total resources being returned:', allResources.length);
    console.log('Resource types:', {
      videos: formattedVideos.length,
      articles: formattedArticles.length
    });
    
    // If no resources, return mock data
    if (allResources.length === 0) {
      console.log('No resources found, returning mock data');
      const mockResources = [
        {
          id: `video-${moduleId}-${Date.now()}-mock1`,
          type: 'youtube',
          title: 'Introduction to ' + moduleTitle,
          videoId: 'dQw4w9WgXcQ', // Placeholder video ID
          aiJustification: 'This is a mock video resource since no real resources were found.',
          watched: false
        },
        {
          id: `article-${moduleId}-${Date.now()}-mock1`,
          type: 'article',
          title: 'Getting Started with ' + moduleTitle,
          url: 'https://example.com/article',
          aiJustification: 'This is a mock article resource since no real resources were found.',
          read: false
        }
      ];
      return res.status(200).json({ resources: mockResources });
    }
    
    return res.status(200).json({ resources: allResources });
  } catch (error: any) {
    console.error('Error in fetch-module-resources API:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch module resources' });
  }
}
