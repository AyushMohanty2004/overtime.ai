import React, { useState, useRef, useEffect } from 'react';
import { useAppContext, ChatMessage } from '../lib/context';
import ReactMarkdown from 'react-markdown';

const ChatWindow: React.FC = () => {
  const {
    // Use the module-specific chat messages instead of the global ones
    currentChatMessages,
    addChatMessage,
    activeModule,
    userGoal,
    userKnowledge,
    isDocumentMode,
    documentContent,
    activeResource,
  } = useAppContext();
  
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChatMessages]);

  // Function to send a message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // Add user message to chat
    addChatMessage({
      role: 'user',
      content: message,
    });
    
    setIsLoading(true);
    setMessage('');
    
    try {
      // Format chat history for the API
      const formattedHistory = currentChatMessages.map((msg: ChatMessage) => ({
        role: msg.role,
        content: msg.content,
      }));
      
      // Send request to API
      const response = await fetch('/api/chat-tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          chatHistory: formattedHistory,
          activeModule: activeModule ? {
            title: activeModule.title,
            description: activeModule.description,
          } : null,
          isDocumentMode,
          documentContent,
          activeResource: activeResource ? {
            id: activeResource.id,
            type: activeResource.type,
            title: activeResource.title,
            watched: activeResource.watched,
            read: activeResource.read,
          } : null,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }
      
      const data = await response.json();
      
      // Add AI response to chat
      addChatMessage({
        role: 'ai',
        content: data.response,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message to chat
      addChatMessage({
        role: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to render welcome message if no messages exist
  const renderWelcomeMessage = () => {
    if (currentChatMessages.length === 0) {
      return (
        <div className="ai-message">
          <ReactMarkdown>{`🚨 **Exam/Interview Crunch Time?** I'm your AI study superhero!

Tell me what you're preparing for:
• "CS101 Final Exam tomorrow"  
• "Data Structures job interview"
• "GATE exam in 3 days"

**Or upload your syllabus/job description** for instant prep!`}</ReactMarkdown>
        </div>
      );
    }
    return null;
  };

  // Function to render a chat message
  const renderMessage = (message: ChatMessage) => {
    const messageClass = message.role === 'user' ? 'user-message' : 'ai-message';
    
    return (
      <div key={message.id} className={messageClass}>
        {message.role === 'ai' ? (
          <ReactMarkdown>{message.content}</ReactMarkdown>
        ) : (
          <p>{message.content}</p>
        )}
      </div>
    );
  };

  // Function to request YouTube videos for the current module
  const requestYouTubeVideos = () => {
    if (!activeModule) return;
    
    // Set the message and then submit the form
    setMessage('Give me youtube videos on this topic');
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) form.dispatchEvent(new Event('submit', { cancelable: true }));
    }, 100);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">
              {isDocumentMode ? 'Document Study Chat' : (activeModule ? `Module: ${activeModule.title}` : 'Learning Assistant')}
            </h2>
            <p className="text-sm text-gray-600">
              {isDocumentMode 
                ? 'Ask questions about the document content' 
                : (activeModule 
                    ? 'Ask specific questions about this module' 
                    : 'Chat with your AI learning assistant')}
            </p>
          </div>
          {/* Get YouTube Videos button removed */}
        </div>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {renderWelcomeMessage()}
        {currentChatMessages.map(renderMessage)}
        {isLoading && (
          <div className="ai-message">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2 animate-pulse delay-150"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-300"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Chat Input */}
      <form onSubmit={sendMessage} className="border-t p-4 bg-white">
        <div className="flex">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isDocumentMode 
              ? "Ask about the document content..." 
              : (activeModule 
                  ? `Ask about ${activeModule.title}...` 
                  : "What would you like to learn?")}
            className="flex-1 p-3 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-3 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
