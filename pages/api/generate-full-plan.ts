import type { NextApiRequest, NextApiResponse } from 'next';
import { generateExamPrepPlan } from '../../lib/gemini';

type Data = {
  learningPlan?: any;
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
    const { examGoal, priorKnowledge, timeConstraint, syllabusContent } = req.body;

    if (!examGoal) {
      return res.status(400).json({ error: 'Exam goal is required' });
    }

    console.log('Generating exam prep plan for:', examGoal);
    console.log('Time constraint:', timeConstraint || 'Not provided');
    console.log('Prior knowledge:', priorKnowledge || 'Not provided');
    console.log('Syllabus content provided:', syllabusContent ? 'Yes' : 'No');

    // Generate exam preparation plan with modules, priorities, and time estimates
    const learningPlan = await generateExamPrepPlan({
      examGoal, 
      priorKnowledge: priorKnowledge || '', 
      timeConstraint: timeConstraint || '24 hours',
      syllabusContent: syllabusContent || ''
    });

    console.log('Generated plan with modules:', learningPlan.modules.length);
    
    // Ensure each module has the required properties
    const validatedPlan = {
      ...learningPlan,
      modules: learningPlan.modules.map((module: any, index: number) => ({
        ...module,
        id: module.id || `module-${index + 1}-${Date.now()}`,
        suggestedSearchKeywords: module.suggestedSearchKeywords || [
          module.title,
          `learn ${module.title}`,
          `${module.title} tutorial`,
          `${module.title} for beginners`
        ]
      }))
    };

    return res.status(200).json({ learningPlan: validatedPlan });
  } catch (error: any) {
    console.error('Error generating learning plan:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate learning plan' });
  }
}
