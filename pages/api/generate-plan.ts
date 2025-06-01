import type { NextApiRequest, NextApiResponse } from 'next';
import { generateLearningPlan } from '../../lib/gemini';

type Data = {
  plan?: any;
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
    const { goal, knowledge } = req.body;

    if (!goal) {
      return res.status(400).json({ error: 'Goal is required' });
    }

    const plan = await generateLearningPlan(goal, knowledge || '');
    return res.status(200).json({ plan });
  } catch (error: any) {
    console.error('Error in generate-plan API:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate learning plan' });
  }
}
