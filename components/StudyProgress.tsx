import React from 'react';
import { useAppContext } from '../lib/context';

const StudyProgress: React.FC = () => {
  const { learningPlan } = useAppContext();
  
  // Calculate progress statistics
  const calculateProgress = () => {
    if (!learningPlan?.modules || learningPlan.modules.length === 0) {
      return {
        completedCount: 0,
        totalCount: 0,
        completionPercentage: 0,
        criticalCompletionPercentage: 0,
        timeSpent: '0 hours',
        timeRemaining: '0 hours'
      };
    }
    
    const totalModules = learningPlan.modules.length;
    const completedModules = learningPlan.modules.filter(m => m.status === 'completed').length;
    
    // Calculate critical modules progress
    const criticalModules = learningPlan.modules.filter(m => m.priority === 'critical');
    const completedCriticalModules = criticalModules.filter(m => m.status === 'completed').length;
    
    // Calculate estimated time statistics
    let totalEstimatedTime = 0;
    let remainingEstimatedTime = 0;
    
    learningPlan.modules.forEach(module => {
      // Parse time string (e.g., "30-45 minutes" or "1-2 hours")
      const timeStr = module.estimatedTime || '30 minutes';
      let timeMinutes = 30; // Default
      
      if (timeStr.includes('hour')) {
        const match = timeStr.match(/(\d+)(?:-(\d+))?\s*hours?/);
        if (match) {
          // If range like "1-2 hours", take average
          if (match[2]) {
            timeMinutes = ((parseInt(match[1]) + parseInt(match[2])) / 2) * 60;
          } else {
            timeMinutes = parseInt(match[1]) * 60;
          }
        }
      } else if (timeStr.includes('minute')) {
        const match = timeStr.match(/(\d+)(?:-(\d+))?\s*minutes?/);
        if (match) {
          // If range like "30-45 minutes", take average
          if (match[2]) {
            timeMinutes = (parseInt(match[1]) + parseInt(match[2])) / 2;
          } else {
            timeMinutes = parseInt(match[1]);
          }
        }
      }
      
      totalEstimatedTime += timeMinutes;
      if (module.status !== 'completed') {
        remainingEstimatedTime += timeMinutes;
      }
    });
    
    // Convert minutes to hours for display
    const totalHours = Math.round(totalEstimatedTime / 60 * 10) / 10;
    const remainingHours = Math.round(remainingEstimatedTime / 60 * 10) / 10;
    const spentHours = Math.round((totalEstimatedTime - remainingEstimatedTime) / 60 * 10) / 10;
    
    return {
      completedCount: completedModules,
      totalCount: totalModules,
      completionPercentage: Math.round((completedModules / totalModules) * 100),
      criticalCompletionPercentage: criticalModules.length > 0 
        ? Math.round((completedCriticalModules / criticalModules.length) * 100) 
        : 100,
      timeSpent: `${spentHours} hours`,
      timeRemaining: `${remainingHours} hours`
    };
  };
  
  const progress = calculateProgress();
  
  // No need to render if there's no learning plan
  if (!learningPlan?.modules || learningPlan.modules.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h3 className="text-lg font-bold mb-3">Study Progress</h3>
      
      {/* Overall progress */}
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm font-medium">{progress.completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${progress.completionPercentage}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {progress.completedCount} of {progress.totalCount} modules completed
        </div>
      </div>
      
      {/* Critical topics progress */}
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">Critical Topics</span>
          <span className="text-sm font-medium">{progress.criticalCompletionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-red-600 h-2.5 rounded-full" 
            style={{ width: `${progress.criticalCompletionPercentage}%` }}
          ></div>
        </div>
      </div>
      
      {/* Time statistics */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-xs text-gray-500">Time Spent</div>
          <div className="text-lg font-bold">{progress.timeSpent}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-xs text-gray-500">Time Remaining</div>
          <div className="text-lg font-bold">{progress.timeRemaining}</div>
        </div>
      </div>
    </div>
  );
};

export default StudyProgress;
