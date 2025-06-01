import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with your API key
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

type Data = {
  summary?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { resourceTitle, resourceType, moduleTitle } = req.body;

    if (!resourceTitle || !resourceType || !moduleTitle) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
    You are an expert educational content summarizer. Your task is to create a concise, informative summary of a resource.
    
    RESOURCE: ${resourceTitle} (${resourceType})
    MODULE: ${moduleTitle}
    
    Create a brief summary (3-5 sentences) of what this resource likely covers based on its title and the module context.
    Since you don't have direct access to the resource content, focus on what would be the most likely key points and takeaways
    from a resource with this title in the context of this learning module.
    
    Your summary should:
    1. Be informative and educational
    2. Cover the most likely main points
    3. Be written in a clear, concise style
    4. Avoid speculative language like "might" or "probably" - write as if you're certain of the content
    
    Only return the summary text, nothing else.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();
    
    return res.status(200).json({ summary });
  } catch (error: any) {
    console.error('Error in generate-summary API:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate summary' });
  }
}
