import React, { useState } from 'react';
import { Module, useAppContext } from '../lib/context';
import PracticeQuestions from './PracticeQuestions';

// Define priority colors and icons
const PRIORITY_STYLES = {
  critical: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    icon: '🔴',
    label: 'Critical'
  },
  important: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    icon: '🟠',
    label: 'Important'
  },
  helpful: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    icon: '🟡',
    label: 'Helpful'
  }
};

interface ModuleItemProps {
  module: Module;
}

const ModuleItem: React.FC<ModuleItemProps> = ({ module }) => {
  const { activeModule, setActiveModule, updateModuleStatus, setModuleResources, setIsLoadingResources } = useAppContext();
  
  // State for practice questions
  const [showPracticeQuestions, setShowPracticeQuestions] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  // Determine if this module is active
  const isActive = activeModule?.id === module.id;
  
  // Determine the appropriate CSS classes based on module status
  const getModuleClasses = () => {
    let classes = 'module-item';
    
    if (isActive) {
      classes += ' module-active';
    }
    
    if (module.status === 'completed') {
      classes += ' module-completed';
    }
    
    return classes;
  };
  
  // Handle click on module item
  const handleModuleClick = () => {
    // Toggle expanded state
    setExpanded(!expanded);
    
    // Only set as active if not already expanded
    if (!expanded) {
      // Set this module as active
      setActiveModule(module);
      
      // If the module is pending, update its status to active
      if (module.status === 'pending') {
        updateModuleStatus(module.id, 'active');
      }
      
      // Fetch resources when expanding
      fetchModuleResources();
    }
  };
  
  // Fetch resources for this module
  const fetchModuleResources = async () => {
    
    // Fetch resources for this module if it has suggestedSearchKeywords
    if (module.suggestedSearchKeywords && module.suggestedSearchKeywords.length > 0) {
      // Set loading state
      setIsLoadingResources(true);
      
      try {
        const response = await fetch('/api/fetch-module-resources', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keywords: module.suggestedSearchKeywords,
            moduleId: module.id,
            moduleTitle: module.title
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Resources fetched for module ${module.id}:`, data);
          
          // Update resources in context
          if (data.resources) {
            setModuleResources(data.resources);
          }
        }
      } catch (error) {
        console.error('Error fetching resources:', error);
      } finally {
        // Clear loading state
        setIsLoadingResources(false);
      }
    } else {
      // Clear resources if no keywords are available
      setModuleResources([]);
    }
  };
  
  // Render status icon based on module status
  const renderStatusIcon = () => {
    switch (module.status) {
      case 'completed':
        return <span className="text-green-500 text-lg">✅</span>;
      case 'active':
        return <span className="text-blue-500 text-lg">⏳</span>;
      default:
        return <span className="text-gray-400 text-lg">⬜</span>;
    }
  };

  // Get priority style based on module priority
  const getPriorityStyle = () => {
    const priority = module.priority || 'helpful';
    return PRIORITY_STYLES[priority as keyof typeof PRIORITY_STYLES];
  };

  const priorityStyle = getPriorityStyle();

  // Toggle practice questions
  const togglePracticeQuestions = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent click handler
    setShowPracticeQuestions(!showPracticeQuestions);
  };

  return (
    <div className="mb-3 rounded-lg shadow-sm overflow-hidden">
      <div
        className={`p-3 border-l-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${isActive ? 'border-l-red-600 bg-red-50' : `border-l-${priorityStyle.bg.replace('bg-', '')}`}`}
        onClick={handleModuleClick}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <div className="mr-3 mt-1">{renderStatusIcon()}</div>
            <div>
              <div className="flex items-center">
                <h3 className="font-medium text-gray-900">{module.title}</h3>
                <span className={`ml-2 text-xs px-2 py-1 rounded-full ${priorityStyle.bg} ${priorityStyle.text}`}>
                  {priorityStyle.icon} {priorityStyle.label}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{module.description}</p>
              
              {/* Key concepts preview */}
              {module.keyConceptsPreview && (
                <div className="mt-2 text-xs text-gray-500">
                  <span className="font-medium">Key concepts:</span> {module.keyConceptsPreview}
                </div>
              )}

              {/* Estimated time */}
              <div className="mt-2 flex items-center">
                <svg className="h-4 w-4 text-gray-400 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-gray-500">{module.estimatedTime || '30-45 minutes'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end space-y-2">
            {/* Progress indicator */}
            {module.status === 'completed' && (
              <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                Completed
              </div>
            )}
            {module.status === 'active' && (
              <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                In Progress
              </div>
            )}
            
            {/* Expand/collapse indicator */}
            <div className="text-gray-400">
              {expanded ? '▼' : '▶'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Expanded content */}
      {expanded && (
        <div className="border-t p-3 bg-gray-50">
          {/* Practice Questions Button */}
          <button
            onClick={togglePracticeQuestions}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mb-3"
          >
            {showPracticeQuestions ? 'Hide Practice Questions' : 'Test Your Knowledge'}
          </button>
          
          {/* Practice Questions Component */}
          {showPracticeQuestions && (
            <PracticeQuestions module={module} />
          )}
          
          {/* Mark as Complete Button */}
          {module.status !== 'completed' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateModuleStatus(module.id, 'completed');
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Mark as Complete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ModuleItem;
