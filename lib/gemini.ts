import { GoogleGenerativeAI } from '@google/generative-ai';

// Interface for exam prep plan parameters
interface ExamPrepParams {
  examGoal: string;
  priorKnowledge: string;
  timeConstraint: string;
  syllabusContent: string;
}

// Initialize the Google Generative AI with your API key
// Note: In production, you should use environment variables for API keys
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

// Function to generate an exam preparation plan with time constraints and syllabus content
export async function generateExamPrepPlan(params: ExamPrepParams) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Extract parameters
    const { examGoal, priorKnowledge, timeConstraint, syllabusContent } = params;
    
    // Create a prompt that emphasizes urgent exam preparation
    const prompt = `
    You are an expert exam preparation AI that creates last-minute study plans tailored to urgent exam needs.
    
    EXAM/INTERVIEW GOAL: ${examGoal}
    TIME CONSTRAINT: ${timeConstraint}
    PRIOR KNOWLEDGE: ${priorKnowledge}
    ${syllabusContent ? `SYLLABUS CONTENT: ${syllabusContent}` : ''}
    
    INSTRUCTIONS FOR CREATING THE EXAM PREPARATION PLAN:
    1. Create a structured study plan with modules prioritized for the limited time available (${timeConstraint}).
    2. Assign each module a priority level: "critical" (must know), "important" (should know), or "helpful" (if time permits).
    3. Estimate study time for each module based on complexity and the total time constraint.
    4. For each module, provide 4-6 specific search keywords that will help find relevant educational resources.
    5. Include a brief list of key concepts that will be covered in each module.
    6. Ensure the plan focuses on the most exam-relevant content first.
    
    IMPORTANT GUIDELINES:
    - Focus on breadth over depth given the time constraint
    - Prioritize concepts most likely to appear on the exam/interview
    - If syllabus content is provided, align modules directly with it
    - Keep descriptions concise and actionable
    - Include practice question suggestions where possible
    
    Return the exam preparation plan as a JSON object with the following structure:
    {
      "planTitle": "Rapid Revision Plan for [EXAM NAME]",
      "description": "A focused study plan designed for [TIME CONSTRAINT] preparation",
      "modules": [
        {
          "id": "module-1",
          "title": "Module Title",
          "description": "Concise description of what will be covered",
          "priority": "critical", // One of: critical, important, helpful
          "estimatedTime": "45 minutes", // Estimated study time
          "keyConceptsPreview": "Key concept 1, Key concept 2, Key concept 3",
          "suggestedSearchKeywords": ["specific keyword 1", "specific keyword 2", "specific keyword 3"]
        },
        // more modules...
      ]
    }
    
    Only return the JSON object, nothing else. Ensure the JSON is valid and properly formatted.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse the JSON response
    try {
      // Extract JSON if it's wrapped in code blocks
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                        text.match(/```\n([\s\S]*?)\n```/) || 
                        [null, text];
      
      const jsonStr = jsonMatch[1] || text;
      const plan = JSON.parse(jsonStr);
      
      // Add status to each module
      if (plan.modules && Array.isArray(plan.modules)) {
        plan.modules = plan.modules.map((module: any, index: number) => ({
          ...module,
          id: module.id || `module-${index + 1}-${Date.now()}`,
          status: index === 0 ? 'active' : 'pending',
          // Ensure required properties exist
          priority: module.priority || (index < 2 ? 'critical' : index < 4 ? 'important' : 'helpful'),
          estimatedTime: module.estimatedTime || '30-45 minutes',
          keyConceptsPreview: module.keyConceptsPreview || '',
          suggestedSearchKeywords: module.suggestedSearchKeywords || [
            module.title,
            `${module.title} exam questions`,
            `${module.title} practice problems`,
            `${module.title} quick tutorial`
          ]
        }));
      }
      
      return plan;
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      throw new Error('Failed to generate a valid exam preparation plan');
    }
  } catch (error) {
    console.error('Error generating exam prep plan with Gemini:', error);
    throw error;
  }
}

// Function to generate a learning plan based on user goal and knowledge
export async function generateLearningPlan(goal: string, knowledge: string) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
    You are an expert learning companion AI that creates personalized learning plans.
    
    USER GOAL: ${goal}
    
    INSTRUCTIONS FOR CREATING THE LEARNING PLAN:
    1. Create a structured learning plan with 3-7 modules that will help the user achieve their goal.
    2. Each module should be focused on a specific skill or concept that builds toward the overall goal.
    3. For each module, provide 4-6 specific search keywords that will help find relevant educational resources.
    4. Ensure the plan follows a logical progression from basic to advanced concepts.
    5. Keep descriptions concise and focused (2-3 sentences maximum).
    
    IMPORTANT GUIDELINES FOR SEARCH KEYWORDS:
    - Include specific technical terms relevant to the module
    - Include phrases like "tutorial", "guide", "for beginners" where appropriate
    - Make keywords specific enough to return relevant YouTube videos and articles
    - Avoid overly generic terms
    
    Return the learning plan as a JSON object with the following structure:
    {
      "title": "The overall title of the learning plan",
      "description": "A brief description of the learning plan (1-2 sentences)",
      "modules": [
        {
          "id": "module-1",
          "title": "Module 1 Title",
          "description": "Concise description of what will be covered (2-3 sentences)",
          "suggestedSearchKeywords": ["specific keyword 1", "specific keyword 2", "specific keyword 3", "specific keyword 4"]
        },
        // more modules...
      ]
    }
    
    Only return the JSON object, nothing else. Ensure the JSON is valid and properly formatted.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    try {
      // Find JSON in the response (in case there's any additional text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      let plan;
      if (jsonMatch) {
        plan = JSON.parse(jsonMatch[0]);
      } else {
        plan = JSON.parse(text);
      }
      
      // Ensure the plan has the correct structure
      const normalizedPlan = {
        planTitle: plan.title || plan.planTitle || goal,
        description: plan.description || '',
        modules: []
      };
      
      // Ensure each module has the required properties
      if (plan && plan.modules && Array.isArray(plan.modules)) {
        normalizedPlan.modules = plan.modules.map((module: any, index: number) => {
          // Ensure module has an ID
          const moduleId = module.id || `module-${index + 1}-${Date.now()}`;
          
          // Ensure module has suggestedSearchKeywords
          let keywords = module.suggestedSearchKeywords || [];
          if (!Array.isArray(keywords) || keywords.length === 0) {
            console.log(`Adding default search keywords for module: ${module.title}`);
            // Add default search keywords based on module title
            keywords = [
              module.title,
              `learn ${module.title}`,
              `${module.title} tutorial`,
              `${module.title} for beginners`
            ];
          }
          
          // Return normalized module
          return {
            id: moduleId,
            title: module.title || `Module ${index + 1}`,
            description: module.description || '',
            suggestedSearchKeywords: keywords,
            status: 'pending'
          };
        });
      }
      
      console.log('Generated normalized learning plan:', normalizedPlan);
      return normalizedPlan;
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      throw new Error('Failed to parse learning plan response');
    }
  } catch (error) {
    console.error('Error generating learning plan:', error);
    throw error;
  }
}

// Function to get AI tutor response in chat
export async function getChatTutorResponse(
  currentMessage: string,
  chatHistory: Array<{ role: string; content: string }>,
  activeModule: { title: string; description: string } | null,
  isDocumentMode: boolean = false,
  documentContent: string = '',
  activeResource: { id: string; type: string; title: string; watched?: boolean; read?: boolean } | null = null
) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    let systemPrompt = '';
    
    if (isDocumentMode) {
      systemPrompt = `
      You are an expert learning companion AI that helps users understand documents and study materials.
      
      DOCUMENT CONTENT:
      ${documentContent}
      
      Your role is to:
      1. Answer questions about the document content
      2. Explain concepts from the document in a clear, concise manner
      3. Generate quiz questions from the document content if requested
      4. Summarize sections of the document if asked
      
      Only reference information that is present in the document. If asked about something not in the document,
      politely explain that the information isn't in the current document.
      
      Be helpful, accurate, and educational in your responses.
      `;
    } else if (activeModule) {
      systemPrompt = `
      You are LearnSpark AI, a friendly and concise learning companion helping with the module: "${activeModule.title}"
      
      CURRENT MODULE: ${activeModule.title}
      MODULE DESCRIPTION: ${activeModule.description}
      ${activeResource ? `
      ACTIVE RESOURCE: ${activeResource.title} (${activeResource.type})  
      RESOURCE STATUS: ${activeResource.type === 'youtube' ? (activeResource.watched ? 'Watched' : 'Not watched yet') : (activeResource.read ? 'Read' : 'Not read yet')}
      ` : ''}
      
      CONVERSATION GUIDELINES:
      1. **Be Concise:** Keep explanations brief (2-3 sentences per concept).
      2. **One Thing at a Time:** Focus on one concept or question per response.
      3. **Use Markdown:** Use bullet points for lists, **bold** for key terms, and code blocks for code snippets.
      4. **Socratic Method:** Ask open-ended questions to stimulate thinking.
      5. **Positive & Encouraging:** Maintain a supportive tone.
      6. **Listen Actively:** Address the user's specific questions before moving on.
      7. **No Long Paragraphs:** Break complex concepts into bullet points or multiple shorter messages.
      
      YOUR TUTORING APPROACH:
      1. Provide clear, concise explanations related to this module
      2. Ask guiding questions to help the user discover concepts themselves
      3. Break down complex topics into manageable pieces
      4. Offer positive reinforcement for correct understanding
      5. Periodically assess the user's understanding with simple questions
      ${activeResource ? `6. Reference and discuss the active resource when relevant
      7. If the user has watched/read the resource, help them apply what they learned` : ''}
      
      When the user demonstrates understanding of a concept, briefly acknowledge it and move on.
      Example: "**Great job!** You've understood [concept]. Let's move to [next concept]."
      
      If the user asks for YouTube videos or resources, suggest they click the "Get YouTube Videos" button or recommend specific search terms.
      
      Be encouraging, patient, and adapt to the user's learning pace.
      `;
    } else {
      systemPrompt = `
      You are an expert learning companion AI that helps users achieve their learning goals.
      
      Your role is to:
      1. Help users define clear learning goals
      2. Assess their existing knowledge
      3. Provide guidance and explanations
      4. Be encouraging and supportive
      
      Be conversational, helpful, and focused on the user's learning journey.
      `;
    }
    
    // Format the chat history for the Gemini API
    // Prepend the system prompt as a model message at the beginning if history is empty
    // or if the first message isn't already our system prompt
    let formattedHistory = chatHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
    
    // If we have no history or the first message isn't our system prompt
    if (formattedHistory.length === 0 || 
        (formattedHistory[0].role !== 'model' || !formattedHistory[0].parts[0].text.includes('learning companion AI'))) {
      // Add system prompt as a model message at the beginning
      formattedHistory = [
        { role: 'model', parts: [{ text: systemPrompt }] },
        ...formattedHistory
      ];
    }
    
    // Start a chat session
    const chat = model.startChat({
      history: formattedHistory,
    });
    
    // Generate a response to the current message
    const result = await chat.sendMessage(currentMessage);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error getting chat tutor response:', error);
    throw error;
  }
}
