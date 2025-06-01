import type { NextApiRequest, NextApiResponse } from 'next';
import { getChatTutorResponse } from '../../lib/gemini';

type Data = {
  response?: string;
  error?: string;
};

// Function to check if message is requesting YouTube videos
const isRequestingVideos = (message: string): boolean => {
  const videoKeywords = ['youtube', 'video', 'videos', 'watch'];
  const message_lower = message.toLowerCase();
  
  return videoKeywords.some(keyword => message_lower.includes(keyword)) &&
    (message_lower.includes('show me') || 
     message_lower.includes('give me') ||
     message_lower.includes('can you') ||
     message_lower.includes('i want') ||
     message_lower.includes('get'));
};

// Function to fetch YouTube videos for a topic
async function fetchYouTubeVideos(topic: string) {
  try {
    console.log('Fetching YouTube videos for topic:', topic);
    
    // Create search keywords from the topic
    const searchKeywords = [
      topic,
      `${topic} tutorial`,
      `learn ${topic}`,
      `${topic} for beginners`
    ];
    
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/fetch-module-resources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        moduleId: 'video-request',
        moduleTitle: topic,
        moduleDescription: `Learning about ${topic}`,
        searchKeywords: searchKeywords,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch videos');
    }
    
    const data = await response.json();
    return data.resources.filter((r: any) => r.type === 'youtube').slice(0, 3); // Return up to 3 videos
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return [];
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, chatHistory, activeModule, isDocumentMode, documentContent, activeResource } = req.body;
    
    // Check if the user is requesting videos
    if (isRequestingVideos(message) && activeModule) {
      console.log('User is requesting videos for:', activeModule.title);
      
      // Fetch videos related to the active module
      const videos = await fetchYouTubeVideos(activeModule.title);
      
      if (videos && videos.length > 0) {
        // Format videos as markdown
        const videoLinks = videos.map((video: any, index: number) => 
          `${index + 1}. [${video.title}](https://www.youtube.com/watch?v=${video.videoId}) - ${video.aiJustification}`
        ).join('\n\n');
        
        const response = `Here are some YouTube videos about ${activeModule.title} that might help you:\n\n${videoLinks}\n\nYou can click on any of these links to watch the videos. Let me know if you have questions about the content!`;
        
        return res.status(200).json({ response });
      }
    }

    // If not requesting videos or no videos found, proceed with normal chat response
    const response = await getChatTutorResponse(
      message,
      chatHistory || [],
      activeModule,
      isDocumentMode || false,
      documentContent || '',
      activeResource
    );

    return res.status(200).json({ response });
  } catch (error: any) {
    console.error('Error in chat-tutor API:', error);
    return res.status(500).json({ error: error.message || 'Failed to get tutor response' });
  }
}
