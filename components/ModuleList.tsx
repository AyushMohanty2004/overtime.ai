import React from 'react';
import { useAppContext } from '../lib/context';
import ModuleItem from './ModuleItem';
import ModuleResources from './ModuleResources';
import StudyProgress from './StudyProgress';

const ModuleList: React.FC = () => {
  // Call all hooks at the top level, unconditionally
  const { learningPlan, isGeneratingPlan, activeModule } = useAppContext();
  
  // If no learning plan exists yet, show a placeholder
  if (!learningPlan && !isGeneratingPlan) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-gray-500">
        <p className="mb-4">Your personalized learning plan will appear here once you set a goal in the chat.</p>
        <p className="text-sm">Tell me what you want to learn in the chat on the right!</p>
      </div>
    );
  }
  
  // If a plan is being generated, show a loading state
  if (isGeneratingPlan) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="animate-pulse text-center">
          <p className="text-lg font-medium mb-2">Creating your learning plan...</p>
          <p className="text-sm text-gray-500">This will just take a moment.</p>
          <div className="mt-4 flex justify-center">
            <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Add debugging logs
  console.log('ModuleList - Learning plan:', learningPlan);
  console.log('ModuleList - Modules:', learningPlan?.modules);
  
  return (
    <div className="h-full flex flex-col p-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-2">{learningPlan?.planTitle || 'Exam Prep Plan'}</h2>
      <p className="text-sm text-gray-600 mb-4">Click on any module to expand and test your knowledge.</p>
      
      {/* Study Progress Component */}
      <StudyProgress />
      
      <div className="space-y-2 mb-6">
        {learningPlan?.modules && learningPlan.modules.length > 0 ? (
          learningPlan.modules.map((module) => (
            <ModuleItem key={module.id} module={module} />
          ))
        ) : (
          <p className="text-gray-500 italic">No modules available</p>
        )}
      </div>
      
      {/* Show resources when a module is active */}
      {activeModule && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <ModuleResources />
        </div>
      )}
    </div>
  );
};

export default ModuleList;
