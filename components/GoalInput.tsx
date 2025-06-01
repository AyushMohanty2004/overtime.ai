import React, { useState, useRef } from 'react';
import { useAppContext } from '../lib/context';
import { useRouter } from 'next/router';

const GoalInput: React.FC = () => {
  const { 
    setUserGoal, 
    setUserKnowledge, 
    setLearningPlan, 
    setIsGeneratingPlan,
    setActiveModule,
    addChatMessage
  } = useAppContext();
  
  const [examGoal, setExamGoal] = useState('');
  const [priorKnowledge, setPriorKnowledge] = useState('');
  const [timeConstraint, setTimeConstraint] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [syllabusContent, setSyllabusContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploadingFile(true);
      setUploadedFileName(e.target.files[0].name);
      // In a real implementation, we would upload the file to the server here
      // For now, we'll just simulate a successful upload
      setTimeout(() => {
        setIsUploadingFile(false);
      }, 1500);
    }
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!examGoal.trim()) {
      setError('Please enter what exam or interview you\'re preparing for');
      return;
    }
    
    setUserGoal(examGoal);
    setStep(2);
    setError('');
  };

  const handleTimeConstraintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
    setError('');
  };

  const handleKnowledgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setUserKnowledge(priorKnowledge);
    setUserGoal(examGoal); // Make sure to set the user goal
    setIsGeneratingPlan(true);
    setIsSubmitting(true); // Set submitting state for UI feedback
    setError('');
    
    console.log('Starting exam prep plan generation for:', examGoal);
    console.log('Time constraint:', timeConstraint);
    console.log('Prior knowledge:', priorKnowledge || 'Not provided');
    console.log('Syllabus content:', syllabusContent || 'Not provided');
    
    try {
      // Add user messages to chat
      addChatMessage({
        role: 'user',
        content: `I'm preparing for ${examGoal}. ${timeConstraint ? `I have ${timeConstraint} to prepare.` : ''} ${priorKnowledge ? `My background: ${priorKnowledge}` : ''}`
      });
      
      // Show loading message
      addChatMessage({
        role: 'ai',
        content: `Creating your rapid revision plan for ${examGoal}... This will take just a moment.`
      });
      
      // Generate learning plan
      console.log('Calling generate-full-plan API...');
      const response = await fetch('/api/generate-full-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          examGoal: examGoal, 
          priorKnowledge: priorKnowledge, 
          timeConstraint: timeConstraint || '24 hours',
          syllabusContent: syllabusContent || ''
        }),
      });
      
      if (!response.ok) {
        console.error('API response not OK:', response.status, response.statusText);
        throw new Error(`Failed to generate plan: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Exam prep plan API response:', data);
      
      // Check if we have a valid learning plan structure
      if (!data.learningPlan || !data.learningPlan.modules) {
        console.error('Invalid API response structure:', data);
        
        // Create a fallback plan if API response is invalid
        data.learningPlan = {
          planTitle: `${examGoal} Rapid Revision Plan`,
          description: `Focused study plan for ${examGoal} with ${timeConstraint || 'limited'} time available.`,
          modules: [
            {
              id: `module-1-${Date.now()}`,
              title: 'Core Concepts',
              description: `Essential concepts for ${examGoal} that you must master`,
              priority: 'critical',
              status: 'active',
              estimatedTime: '60 minutes',
              keyConceptsPreview: 'Fundamental principles and key definitions',
              suggestedSearchKeywords: [examGoal, `${examGoal} basics`, `${examGoal} core concepts`]
            },
            {
              id: `module-2-${Date.now()}`,
              title: 'Common Problems',
              description: 'Typical problems and their solutions',
              priority: 'important',
              status: 'pending',
              estimatedTime: '45 minutes',
              keyConceptsPreview: 'Problem-solving techniques and common challenges',
              suggestedSearchKeywords: [`${examGoal} problems`, `${examGoal} examples`, `${examGoal} practice`]
            },
            {
              id: `module-3-${Date.now()}`,
              title: 'Advanced Topics',
              description: 'More complex aspects if time permits',
              priority: 'helpful',
              status: 'pending',
              estimatedTime: '30 minutes',
              keyConceptsPreview: 'Advanced applications and edge cases',
              suggestedSearchKeywords: [`${examGoal} advanced`, `${examGoal} expert level`, `${examGoal} deep dive`]
            }
          ]
        };
        
        console.log('Created fallback plan:', data.learningPlan);
      }
      
      // Make sure all modules have the required properties
      const processedModules = data.learningPlan.modules.map((module: any, index: number) => ({
        ...module,
        id: module.id || `module-${index + 1}-${Date.now()}`,
        status: index === 0 ? 'active' : 'pending',
        priority: module.priority || (index === 0 ? 'critical' : index < 3 ? 'important' : 'helpful'),
        estimatedTime: module.estimatedTime || `${Math.max(30, 60 - index * 10)} minutes`,
        suggestedSearchKeywords: module.suggestedSearchKeywords || [module.title, examGoal, 'exam prep']
      }));
      
      // Make sure the learning plan has the correct structure
      const updatedPlan = {
        planTitle: data.learningPlan.planTitle || `${examGoal} Rapid Revision Plan`,
        description: data.learningPlan.description || `Focused study plan for ${examGoal} with ${timeConstraint || 'limited'} time available.`,
        modules: processedModules
      };
      
      console.log('Updated exam prep plan with module priorities:', updatedPlan);
      
      // Force a re-render by creating a new object
      const finalPlan = JSON.parse(JSON.stringify(updatedPlan));
      
      // Set the learning plan in context
      setLearningPlan(finalPlan);
      
      // Set the first module as active
      if (processedModules.length > 0) {
        setActiveModule(processedModules[0]);
      }
      
      // Force a state update by setting isGeneratingPlan to false
      setTimeout(() => {
        setIsGeneratingPlan(false);
      }, 500);
      
      // Add AI response to chat
      addChatMessage({
        role: 'ai',
        content: `🚨 **Rapid Revision Plan Created!** 🚨

I've created a focused exam prep plan for your **${examGoal}** ${timeConstraint ? `with only ${timeConstraint} available` : 'with limited time'}.

The plan has ${finalPlan.modules.length} modules prioritized by importance:
- 🔴 **Critical** - Must know for the exam
- 🟠 **Important** - High-value concepts
- 🟡 **Helpful** - Cover if time permits

Click on any module to start studying. For each module, I can:
- Explain key concepts in a concise, exam-focused way
- Provide practice questions
- Find short, targeted videos and articles
- Generate flashcards for quick review

Let's start with the highest priority module!`
      });
      
      // Log the final state after all updates
      console.log('Final exam prep plan set in context:', finalPlan);
      console.log('First module set as active:', processedModules[0]);
      
    } catch (error: any) {
      console.error('Error generating plan:', error);
      setError(error.message || 'Failed to generate learning plan');
      setIsGeneratingPlan(false);
      
      // Add error message to chat
      addChatMessage({
        role: 'ai',
        content: `I encountered an issue while creating your exam prep plan. Let's try again with a different approach. Please check your inputs and try again, or try with a more specific exam goal.`
      });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleTryDemo = () => {
    setExamGoal('Data Structures and Algorithms final exam');
    setUserGoal('Data Structures and Algorithms final exam');
    setTimeConstraint('48 hours');
    setStep(2);
  };

  if (step === 1) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 border-t-4 border-red-600">
          <h2 className="text-2xl font-bold mb-2 text-center text-red-600">Last-Minute Exam Prep</h2>
          <p className="text-gray-600 mb-6 text-center">Tell us what you're preparing for</p>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {/* File Upload UI */}
          <div className="mb-6 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={triggerFileUpload}>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload} 
              accept=".pdf,.txt,.doc,.docx"
            />
            {isUploadingFile ? (
              <div className="flex flex-col items-center justify-center">
                <svg className="animate-spin h-8 w-8 text-red-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm text-gray-500">Uploading file...</p>
              </div>
            ) : uploadedFileName ? (
              <div className="flex flex-col items-center justify-center">
                <svg className="h-8 w-8 text-green-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-medium">{uploadedFileName}</p>
                <p className="text-xs text-gray-500 mt-1">Click to change file</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <svg className="h-8 w-8 text-gray-400 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm font-medium">Upload syllabus or job description</p>
                <p className="text-xs text-gray-500 mt-1">Drag & drop or click to browse</p>
                <p className="text-xs text-gray-400 mt-2">Supports PDF, TXT, DOC, DOCX</p>
              </div>
            )}
          </div>
          
          <form onSubmit={handleGoalSubmit}>
            <div className="mb-4">
              <label htmlFor="examGoal" className="block text-gray-700 text-sm font-bold mb-2">
                What are you preparing for? <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="examGoal"
                value={examGoal}
                onChange={(e) => setExamGoal(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="e.g., CS101 Final Exam, Data Science Interview"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Continue
              </button>
              
              <button
                type="button"
                onClick={handleTryDemo}
                className="inline-block align-baseline font-bold text-sm text-red-600 hover:text-red-800"
              >
                Try Demo
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
  
  if (step === 2) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 border-t-4 border-red-600">
          <h2 className="text-2xl font-bold mb-2 text-center text-red-600">How much time do you have?</h2>
          <p className="text-gray-600 mb-6 text-center">This helps me prioritize what to study first</p>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleTimeConstraintSubmit}>
            <div className="mb-6">
              <label htmlFor="timeConstraint" className="block text-gray-700 text-sm font-bold mb-2">
                Time until your {examGoal} <span className="text-red-500">*</span>
              </label>
              <select
                id="timeConstraint"
                value={timeConstraint}
                onChange={(e) => setTimeConstraint(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Select time available</option>
                <option value="3 hours">Just 3 hours!</option>
                <option value="6 hours">About 6 hours</option>
                <option value="12 hours">12 hours (half day)</option>
                <option value="24 hours">24 hours (1 day)</option>
                <option value="48 hours">48 hours (2 days)</option>
                <option value="72 hours">72 hours (3 days)</option>
                <option value="1 week">1 week</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Back
              </button>
              
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Continue
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
  
  if (step === 3) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 border-t-4 border-red-600">
          <h2 className="text-2xl font-bold mb-2 text-center text-red-600">What do you already know?</h2>
          <p className="text-gray-600 mb-6 text-center">This helps me focus on what you need to learn</p>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleKnowledgeSubmit}>
            <div className="mb-4">
              <label htmlFor="priorKnowledge" className="block text-gray-700 text-sm font-bold mb-2">
                Your Existing Knowledge (Optional)
              </label>
              <textarea
                id="priorKnowledge"
                value={priorKnowledge}
                onChange={(e) => setPriorKnowledge(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
                placeholder="e.g., I understand basic concepts but struggle with advanced topics"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Back
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className={`bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Revision Plan...
                  </>
                ) : (
                  'Create Rapid Revision Plan'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
  
  return null;
};

export default GoalInput;
