import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Generative AI with API key
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { moduleId, moduleTitle, moduleDescription, keyConceptsPreview, count = 5 } = req.body;

    if (!moduleId || !moduleTitle) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Generate practice questions using Gemini AI
    const questions = await generatePracticeQuestions(
      moduleTitle,
      moduleDescription,
      keyConceptsPreview,
      count
    );

    return res.status(200).json({ questions });
  } catch (error) {
    console.error('Error generating practice questions:', error);
    return res.status(500).json({ error: 'Failed to generate practice questions' });
  }
}

async function generatePracticeQuestions(
  moduleTitle: string,
  moduleDescription: string = '',
  keyConceptsPreview: string = '',
  count: number = 5
) {
  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Construct the prompt
    const prompt = `
    Generate ${count} practice questions for a last-minute exam preparation on the topic: "${moduleTitle}".
    
    Additional context about this module:
    ${moduleDescription}
    
    Key concepts covered in this module:
    ${keyConceptsPreview || 'Not specified'}
    
    For each question:
    1. Create a challenging but fair multiple-choice question that tests understanding, not just memorization
    2. Provide 4 answer options (A, B, C, D)
    3. Indicate which option is correct (0-based index, where 0 is A, 1 is B, etc.)
    4. Include a brief explanation of why the correct answer is right and why others are wrong
    
    Return the questions in the following JSON format:
    [
      {
        "text": "Question text here?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "explanation": "Explanation of the correct answer"
      },
      ...more questions
    ]
    
    The questions should be exam-focused, testing critical knowledge needed to pass an exam on this topic.
    Include questions that test different cognitive levels (knowledge, comprehension, application, analysis).
    `;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    
    if (!jsonMatch) {
      console.error('Failed to extract JSON from Gemini response');
      return getFallbackQuestions(moduleTitle);
    }
    
    try {
      const questions = JSON.parse(jsonMatch[0]);
      return questions;
    } catch (parseError) {
      console.error('Error parsing JSON from Gemini response:', parseError);
      return getFallbackQuestions(moduleTitle);
    }
  } catch (error) {
    console.error('Error in Gemini API call:', error);
    return getFallbackQuestions(moduleTitle);
  }
}

// Fallback questions in case the API fails
function getFallbackQuestions(moduleTitle: string) {
  return [
    {
      text: `What is the main focus of "${moduleTitle}"?`,
      options: [
        'Understanding core concepts',
        'Memorizing definitions',
        'Practical applications',
        'Historical context'
      ],
      correctAnswer: 0,
      explanation: 'The main focus is understanding core concepts as they form the foundation for more advanced topics.'
    },
    {
      text: 'Which of the following best describes a key learning outcome from this module?',
      options: [
        'Ability to recite facts',
        'Critical thinking and problem solving',
        'Memorization of formulas',
        'Speed of calculation'
      ],
      correctAnswer: 1,
      explanation: 'Critical thinking and problem solving are essential skills developed in this module.'
    },
    {
      text: 'In a typical exam question on this topic, what would you be asked to do?',
      options: [
        'Compare and contrast concepts',
        'List definitions in order',
        'Solve a practical problem',
        'Describe historical development'
      ],
      correctAnswer: 2,
      explanation: 'Exam questions typically focus on applying knowledge to solve practical problems.'
    }
  ];
}
