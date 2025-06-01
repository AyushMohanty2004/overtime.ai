import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAppContext } from '../lib/context';
import ChatWindow from '../components/ChatWindow';
import ModuleList from '../components/ModuleList';
import DocumentMode from '../components/DocumentMode';
import GoalInput from '../components/GoalInput';
import CountdownTimer from '../components/CountdownTimer';

const Home: React.FC = () => {
  const {
    userGoal,
    setUserGoal,
    userKnowledge,
    setUserKnowledge,
    addChatMessage,
    clearCurrentChatMessages,
    learningPlan,
    setLearningPlan,
    setActiveModule,
    isGeneratingPlan,
    setIsGeneratingPlan,
    isDocumentMode,
    setIsDocumentMode,
  } = useAppContext();
  
  // State for time constraint (for exam countdown)
  const [timeConstraint, setTimeConstraint] = useState<string>('24 hours');
  const [showCountdown, setShowCountdown] = useState<boolean>(false);
  
  // Add debugging logs for learning plan state
  console.log('Home component - Learning plan state:', learningPlan);
  console.log('Home component - Is generating plan:', isGeneratingPlan);
  console.log('Home component - User goal:', userGoal);

  // Function to handle the generation of a learning plan
  const generatePlan = async (goal: string, knowledge: string, constraint?: string, syllabusContent?: string) => {
    setIsGeneratingPlan(true);
    
    // Set time constraint if provided
    if (constraint) {
      setTimeConstraint(constraint);
      setShowCountdown(true);
    }
    
    try {
      // Use generate-full-plan endpoint which handles time constraints and syllabus content
      const response = await fetch('/api/generate-full-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          examGoal: goal, 
          priorKnowledge: knowledge,
          timeConstraint: constraint || timeConstraint,
          syllabusContent: syllabusContent || ''
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate plan');
      }
      
      const data = await response.json();
      
      // Set the learning plan in context
      setLearningPlan(data.plan);
      
      // Set the first module as active
      if (data.plan.modules && data.plan.modules.length > 0) {
        const firstModule = {
          ...data.plan.modules[0],
          status: 'active',
        };
        setActiveModule(firstModule);
        
        // Update the first module's status in the plan
        const updatedModules = data.plan.modules.map((module: any, index: number) => {
          if (index === 0) {
            return { ...module, status: 'active' };
          }
          return module;
        });
        
        setLearningPlan({
          ...data.plan,
          modules: updatedModules,
        });
      }
      
      // Add AI message about the plan
      addChatMessage({
        role: 'ai',
        content: `Great, that's a solid foundation! Based on your goal to ${goal} and your knowledge, I've crafted this learning plan for you.\n\nI suggest we start with '${data.plan.modules[0].title}' to build on what you know. Click on it in the plan if it's not already active, or select another module if you prefer. Ready to begin?`,
      });
    } catch (error) {
      console.error('Error generating plan:', error);
      
      // Add error message
      addChatMessage({
        role: 'ai',
        content: 'Sorry, I encountered an error while creating your learning plan. Please try again.',
      });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Function to handle the "Try Me" demo flow
  const handleTryDemo = () => {
    const demoGoal = 'build a trading bot';
    const demoKnowledge = 'Python basics – lists, variables, and loops. No real trading algorithm knowledge.';
    
    // Set user goal and knowledge
    setUserGoal(demoGoal);
    setUserKnowledge(demoKnowledge);
    
    // Add demo messages to chat
    addChatMessage({
      role: 'ai',
      content: 'Welcome to your Learning Companion! What skill are you excited to learn or master today?',
    });
    
    addChatMessage({
      role: 'user',
      content: `I want to ${demoGoal}.`,
    });
    
    addChatMessage({
      role: 'ai',
      content: `Ambitious! I like it. To tailor the perfect plan for you, could you tell me a bit about what you already know regarding programming (e.g., specific languages, concepts like APIs) or trading?`,
    });
    
    addChatMessage({
      role: 'user',
      content: `I know ${demoKnowledge}`,
    });
    
    // Generate the learning plan
    generatePlan(demoGoal, demoKnowledge);
  };

  return (
    <div className="flex flex-col h-screen">
      <Head>
        <title>Overtime.AI</title>
        <meta name="description" content="Maximize Your Study Time & Learning Efficiency" />
        <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Ccircle cx='12' cy='12' r='10' stroke='%23dc2626' stroke-width='2'/%3E%3Cpath d='M12 6V12L16 14' stroke='%23dc2626' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E" type="image/svg+xml" />
      </Head>
      
      <header className="bg-white border-b p-4">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="flex items-center mb-3 md:mb-0">
            <div className="flex items-center">
              <svg className="w-8 h-8 mr-2 text-red-600 transform hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="animate-pulse" />
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 4L17 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M9 4L7 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M20 9L22 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M20 15L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <h1 className="text-2xl font-bold text-red-600">Overtime.AI</h1>
            </div>
            <span className="ml-2 text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full">Maximize Your Time</span>
          </div>
          
          {/* Countdown Timer (visible only when a plan is generated) */}
          {showCountdown && learningPlan && learningPlan.modules && learningPlan.modules.length > 0 && (
            <div className="w-full md:w-auto mb-3 md:mb-0 md:mx-4">
              <CountdownTimer 
                timeConstraint={timeConstraint} 
                onTimeUp={() => {
                  addChatMessage({
                    role: 'ai',
                    content: '⏰ **Time Alert!** Your exam preparation time is up! Let\'s do a quick review of what you\'ve learned and focus on any remaining critical concepts.'
                  });
                }}
              />
            </div>
          )}
          
          <div className="flex space-x-2">
            {/* Try Demo button removed from header */}
            <button
              onClick={() => {
                // Reset the app state to start a new topic
                setUserGoal('');
                setUserKnowledge('');
                setTimeConstraint('24 hours');
                setShowCountdown(false);
                // Use empty learning plan object instead of null to fix TypeScript error
                setLearningPlan({
                  planTitle: '',
                  modules: []
                });
                setActiveModule(null);
                // Clear current chat messages for the module
                clearCurrentChatMessages();
                // Add welcome message
                addChatMessage({
                  role: 'ai',
                  content: '⏱️ **Welcome to Overtime.AI!** I\'m your AI learning assistant!\n\nTell me what you\'re learning or preparing for:\n• "CS101 Final Exam tomorrow"  \n• "Data Structures and Algorithms"\n• "Machine Learning basics"\n\n**Or upload your syllabus or learning materials** for a personalized learning plan!'
                });
              }}
              className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 flex items-center"
            >
              <svg className="w-4 h-4 mr-1 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              New Learning Plan
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Show GoalInput when no learning plan exists or when the plan has no modules */}
        {(!learningPlan || !learningPlan.modules || learningPlan.modules.length === 0) ? (
          <div className="flex-1 overflow-hidden">
            <GoalInput />
          </div>
        ) : (
          <>
            {/* Left side: Dynamic Content & Navigation Pane (Modules or Document mode) */}
            <div className="w-full md:w-2/5 lg:w-1/3 border-r overflow-hidden flex flex-col">
              {/* Mode Toggle Buttons */}
              <div className="flex border-b p-2">
                <button
                  onClick={() => setIsDocumentMode(false)}
                  className={`flex-1 py-2 px-3 rounded-lg mr-1 ${!isDocumentMode 
                    ? 'bg-red-500 text-white font-medium' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Learning Mode
                </button>
                <button
                  onClick={() => setIsDocumentMode(true)}
                  className={`flex-1 py-2 px-3 rounded-lg ml-1 ${isDocumentMode 
                    ? 'bg-red-600 text-white font-medium' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Document Mode
                </button>
              </div>
              
              {/* Content Area */}
              <div className="flex-1 overflow-hidden">
                {isDocumentMode ? <DocumentMode /> : <ModuleList />}
              </div>
            </div>
            
            {/* Right side: Chat Interface Pane */}
            <div className="flex-1 overflow-hidden">
              <ChatWindow />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Home;
