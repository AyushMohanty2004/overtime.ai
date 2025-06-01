import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with your API key
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

type Data = {
  questions?: any[];
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
    const { resourceTitle, resourceType, moduleTitle, moduleDescription } = req.body;

    if (!resourceTitle || !resourceType || !moduleTitle) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
    You are an expert educational content creator specializing in creating effective quiz questions.
    
    RESOURCE: ${resourceTitle} (${resourceType})
    MODULE: ${moduleTitle}
    MODULE DESCRIPTION: ${moduleDescription || 'N/A'}
    
    Create 3 multiple-choice quiz questions based on the likely content of this resource.
    Since you don't have direct access to the resource content, create questions that would likely
    test understanding of the core concepts related to the module and resource title.
    
    For each question:
    1. Make it clear and specific
    2. Provide 4 possible answers (only one should be correct)
    3. Ensure the correct answer is not always in the same position
    
    Return your response as a JSON array in the following format:
    [
      {
        "question": "Question text here?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0  // Index of the correct answer (0-3)
      },
      ...more questions...
    ]
    
    Only return the JSON array, nothing else.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    try {
      // Find JSON in the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0]);
        return res.status(200).json({ questions });
      }
      return res.status(200).json({ questions: JSON.parse(text) });
    } catch (error: any) {
      console.error('Error parsing JSON response:', error);
      return res.status(500).json({ error: 'Failed to parse quiz questions response' });
    }
  } catch (error: any) {
    console.error('Error in generate-quiz API:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate quiz questions' });
  }
}
