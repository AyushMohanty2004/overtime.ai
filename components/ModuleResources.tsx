import React, { useEffect } from 'react';
import { useAppContext } from '../lib/context';
import YouTube from 'react-youtube';

// YouTube player options
const youtubeOpts = {
  height: '220',
  width: '100%',
  playerVars: {
    autoplay: 0,
  },
};

const ModuleResources: React.FC = () => {
  const {
    activeModule,
    moduleResources,
    setModuleResources,
    isLoadingResources,
    setIsLoadingResources,
    activeResource,
    setActiveResource,
    addChatMessage
  } = useAppContext();

  // Fetch resources when active module changes
  useEffect(() => {
    const fetchResources = async () => {
      console.log('Active module:', activeModule);
      
      if (!activeModule) {
        console.log('No active module');
        return;
      }
      
      // Create fallback search keywords if none exist
      let searchKeywords = activeModule.suggestedSearchKeywords;
      if (!searchKeywords || !Array.isArray(searchKeywords) || searchKeywords.length === 0) {
        console.log('No search keywords found, creating fallback keywords for:', activeModule.title);
        searchKeywords = [
          activeModule.title,
          `learn ${activeModule.title}`,
          `${activeModule.title} tutorial`,
          `${activeModule.title} for beginners`
        ];
      }
      
      console.log('Search keywords:', searchKeywords);
      
      try {
        setIsLoadingResources(true);
        setActiveResource(null);
        
        const response = await fetch('/api/fetch-module-resources', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            moduleId: activeModule.id,
            moduleTitle: activeModule.title,
            moduleDescription: activeModule.description,
            searchKeywords: searchKeywords, // Use our fallback keywords if needed
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch resources');
        }
        
        const data = await response.json();
        console.log('API response data:', data);
        
        if (!data.resources || data.resources.length === 0) {
          console.log('No resources returned from API');
        } else {
          console.log('Resources fetched successfully:', data.resources.length);
        }
        
        setModuleResources(data.resources || []);
      } catch (error) {
        console.error('Error fetching module resources:', error);
        // Set empty resources on error
        setModuleResources([]);
      } finally {
        setIsLoadingResources(false);
      }
    };
    
    fetchResources();
  }, [activeModule, setIsLoadingResources, setModuleResources, setActiveResource]);

  // Handle resource selection
  const handleResourceSelect = (resource: any) => {
    setActiveResource(resource);
    
    // Add AI message introducing the resource
    const messageContent = resource.type === 'youtube'
      ? `I've found a helpful video about ${activeModule?.title}: "${resource.title}". Watch it to learn more about this topic, and I can answer any questions you have afterward or quiz you on the content.`
      : `I've found a useful article about ${activeModule?.title}: "${resource.title}". Read it to deepen your understanding, and I can answer any questions you have afterward or quiz you on the content.`;
    
    addChatMessage({
      role: 'ai',
      content: messageContent,
    });
  };

  // Mark resource as consumed
  const handleResourceCompleted = async (resource: any) => {
    try {
      // First, generate a summary of the resource
      const summaryResponse = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceTitle: resource.title,
          resourceType: resource.type,
          moduleTitle: activeModule?.title,
        }),
      });
      
      if (!summaryResponse.ok) {
        throw new Error('Failed to generate summary');
      }
      
      const summaryData = await summaryResponse.json();
      const summary = summaryData.summary;
      
      // Update the resource with the summary and completion status
      const updatedResources = moduleResources.map(r => {
        if (r.id === resource.id) {
          if (r.type === 'youtube') {
            return { ...r, watched: true, summary };
          } else {
            return { ...r, read: true, summary };
          }
        }
        return r;
      });
      
      setModuleResources(updatedResources);
      
      // Add AI message with the summary and offering to quiz the user
      addChatMessage({
        role: 'ai',
        content: `Great! Now that you've finished ${resource.type === 'youtube' ? 'watching the video' : 'reading the article'} about ${activeModule?.title}, let me summarize the key points:\n\n${summary}\n\nWould you like me to quiz you on the content to reinforce your learning?`,
      });
    } catch (error) {
      console.error('Error completing resource:', error);
      
      // Update the resource status without a summary
      const updatedResources = moduleResources.map(r => {
        if (r.id === resource.id) {
          if (r.type === 'youtube') {
            return { ...r, watched: true };
          } else {
            return { ...r, read: true };
          }
        }
        return r;
      });
      
      setModuleResources(updatedResources);
      
      // Add AI message offering to quiz the user (without summary)
      addChatMessage({
        role: 'ai',
        content: `Great! Now that you've finished ${resource.type === 'youtube' ? 'watching the video' : 'reading the article'} about ${activeModule?.title}, would you like me to quiz you on the content to reinforce your learning?`,
      });
    }
  };

  // Generate quiz for resource
  const handleGenerateQuiz = async (resource: any) => {
    try {
      // Add AI message with quiz introduction
      addChatMessage({
        role: 'ai',
        content: `Let's test your understanding of ${resource.title}. I'll create a short quiz based on the content. Please respond with your answers.`,
      });
      
      // Call the generate-quiz API
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceTitle: resource.title,
          resourceType: resource.type,
          moduleTitle: activeModule?.title,
          moduleDescription: activeModule?.description,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate quiz');
      }
      
      const data = await response.json();
      
      // Format the quiz questions
      const quizContent = data.questions.map((q: any, index: number) => {
        const options = q.options.map((opt: string, i: number) => 
          `${String.fromCharCode(65 + i)}. ${opt}${i === q.correctAnswer ? ' ✓' : ''}`
        ).join('\n');
        
        return `**Question ${index + 1}**: ${q.question}\n${options}`;
      }).join('\n\n');
      
      // Add the quiz to the chat
      addChatMessage({
        role: 'ai',
        content: `Here's your quiz on ${resource.title}:\n\n${quizContent}\n\nTake your time to answer these questions. The correct answers are marked with ✓ so you can check your understanding.`,
      });
      
      // Save the quiz questions to the resource
      const updatedResources = moduleResources.map(r => {
        if (r.id === resource.id) {
          return { ...r, quizQuestions: data.questions };
        }
        return r;
      });
      
      setModuleResources(updatedResources);
      
    } catch (error) {
      console.error('Error generating quiz:', error);
      
      // Add error message
      addChatMessage({
        role: 'ai',
        content: 'Sorry, I encountered an error while creating your quiz. Let\'s try a different approach. What specific aspects of this resource would you like me to help you understand better?',
      });
    }
  };

  if (!activeModule) {
    return null;
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-3">Learning Resources</h3>
      
      {isLoadingResources ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Finding the best resources...</span>
        </div>
      ) : moduleResources.length === 0 ? (
        <div className="text-gray-500 py-4">
          No resources found for this module. Try refreshing or selecting a different module.
        </div>
      ) : activeResource ? (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-gray-800">{activeResource.title}</h4>
            <button 
              onClick={() => setActiveResource(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {activeResource.type === 'youtube' && (
            <div className="mb-3">
              <YouTube videoId={activeResource.videoId} opts={youtubeOpts} />
            </div>
          )}
          
          {activeResource.type === 'article' && (
            <div className="mb-3">
              <a 
                href={activeResource.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                Open article in new tab
              </a>
            </div>
          )}
          
          <p className="text-sm text-gray-600 mb-3">
            <strong>Why this is helpful:</strong> {activeResource.aiJustification}
          </p>
          
          <div className="flex space-x-2">
            <button
              onClick={() => handleResourceCompleted(activeResource)}
              className={`px-3 py-1.5 text-sm rounded-md ${
                (activeResource.type === 'youtube' && activeResource.watched) || 
                (activeResource.type === 'article' && activeResource.read)
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              }`}
              disabled={(activeResource.type === 'youtube' && activeResource.watched) || 
                       (activeResource.type === 'article' && activeResource.read)}
            >
              {activeResource.type === 'youtube' 
                ? (activeResource.watched ? 'Watched ✓' : 'Mark as watched') 
                : (activeResource.read ? 'Read ✓' : 'Mark as read')}
            </button>
            
            <button
              onClick={() => handleGenerateQuiz(activeResource)}
              className="px-3 py-1.5 text-sm bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200"
            >
              Quiz me
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {moduleResources.map((resource) => (
            <div 
              key={resource.id} 
              className="bg-white rounded-lg shadow p-3 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleResourceSelect(resource)}
            >
              <div className="flex items-start">
                <div className={`flex-shrink-0 rounded-full p-2 mr-3 ${
                  resource.type === 'youtube' ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  {resource.type === 'youtube' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">{resource.title}</h4>
                  <p className="text-xs text-gray-500">
                    {resource.type === 'youtube' ? 'YouTube Video' : 'Web Article'}
                    {(resource.type === 'youtube' && resource.watched) && ' • Watched'}
                    {(resource.type === 'article' && resource.read) && ' • Read'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModuleResources;
