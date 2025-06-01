import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define types for our context
export type Module = {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed';
  suggestedSearchKeywords?: string[];
  // Exam preparation specific fields
  priority?: 'critical' | 'important' | 'helpful';
  estimatedTime?: string;
  keyConceptsPreview?: string;
  completionPercentage?: number;
};

export type LearningPlan = {
  planTitle: string;
  modules: Module[];
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
};

export type Resource = {
  id: string;
  type: 'youtube' | 'article';
  title: string;
  url?: string;
  videoId?: string;
  aiJustification: string;
  watched?: boolean;
  read?: boolean;
  summary?: string;
  quizQuestions?: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
  }>;
};

// Type for module chat histories mapping
export type ModuleChatHistories = {
  [moduleId: string]: ChatMessage[];
};

type AppContextType = {
  userGoal: string;
  setUserGoal: (goal: string) => void;
  userKnowledge: string;
  setUserKnowledge: (knowledge: string) => void;
  learningPlan: LearningPlan | null;
  setLearningPlan: (plan: LearningPlan) => void;
  // Module-specific chat histories
  moduleChatHistories: ModuleChatHistories;
  currentChatMessages: ChatMessage[];
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearCurrentChatMessages: () => void;
  // Legacy chat messages (to be deprecated)
  chatMessages: ChatMessage[];
  clearChatMessages: () => void;
  activeModule: Module | null;
  setActiveModule: (module: Module | null) => void;
  updateModuleStatus: (moduleId: string, status: Module['status']) => void;
  isGeneratingPlan: boolean;
  setIsGeneratingPlan: (isGenerating: boolean) => void;
  isDocumentMode: boolean;
  setIsDocumentMode: (isDocumentMode: boolean) => void;
  documentContent: string;
  setDocumentContent: (content: string) => void;
  // New state for module resources
  moduleResources: Resource[];
  setModuleResources: (resources: Resource[]) => void;
  isLoadingResources: boolean;
  setIsLoadingResources: (isLoading: boolean) => void;
  activeResource: Resource | null;
  setActiveResource: (resource: Resource | null) => void;
};

// Create the context with default values
const AppContext = createContext<AppContextType>({
  userGoal: '',
  setUserGoal: () => {},
  userKnowledge: '',
  setUserKnowledge: () => {},
  learningPlan: null,
  setLearningPlan: () => {},
  // Module-specific chat histories
  moduleChatHistories: {},
  currentChatMessages: [],
  addChatMessage: () => {},
  clearCurrentChatMessages: () => {},
  // Legacy chat messages (to be deprecated)
  chatMessages: [],
  clearChatMessages: () => {},
  activeModule: null,
  setActiveModule: () => {},
  updateModuleStatus: () => {},
  isGeneratingPlan: false,
  setIsGeneratingPlan: () => {},
  isDocumentMode: false,
  setIsDocumentMode: () => {},
  documentContent: '',
  setDocumentContent: () => {},
  // New state defaults
  moduleResources: [],
  setModuleResources: () => {},
  isLoadingResources: false,
  setIsLoadingResources: () => {},
  activeResource: null,
  setActiveResource: () => {},
});

// Provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State for user goal and knowledge
  const [userGoal, setUserGoal] = useState<string>('');
  const [userKnowledge, setUserKnowledge] = useState<string>('');
  
  // State for learning plan
  const [learningPlan, setLearningPlanState] = useState<LearningPlan | null>(null);
  
  // Custom setter for learning plan to ensure proper state updates
  const setLearningPlan = (plan: LearningPlan) => {
    console.log('Context: Setting learning plan:', plan);
    // Force a re-render by creating a new object
    const newPlan = JSON.parse(JSON.stringify(plan));
    setLearningPlanState(newPlan);
  };
  
  // State for module-specific chat histories
  const [moduleChatHistories, setModuleChatHistories] = useState<ModuleChatHistories>({});
  
  // Legacy state for chat messages (to be deprecated)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // State for active module
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  
  // State for plan generation status
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  
  // State for document mode
  const [isDocumentMode, setIsDocumentMode] = useState<boolean>(false);
  const [documentContent, setDocumentContent] = useState<string>('');
  
  // State for module resources
  const [moduleResources, setModuleResources] = useState<Resource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState<boolean>(false);
  const [activeResource, setActiveResource] = useState<Resource | null>(null);
  
  // Derived state for current chat messages based on active module
  const currentChatMessages = activeModule && activeModule.id && moduleChatHistories[activeModule.id] 
    ? moduleChatHistories[activeModule.id] 
    : [];

  // Load state from localStorage on component mount
  useEffect(() => {
    // Disabling localStorage loading to reset state on refresh
    // Uncomment the below code if you want to enable persistence again
    /*
    const storedGoal = localStorage.getItem('userGoal');
    const storedKnowledge = localStorage.getItem('userKnowledge');
    const storedPlan = localStorage.getItem('learningPlan');
    const storedMessages = localStorage.getItem('chatMessages');
    const storedActiveModule = localStorage.getItem('activeModule');
    const storedDocumentMode = localStorage.getItem('isDocumentMode');
    const storedDocumentContent = localStorage.getItem('documentContent');

    if (storedGoal) setUserGoal(storedGoal);
    if (storedKnowledge) setUserKnowledge(storedKnowledge);
    if (storedPlan) setLearningPlan(JSON.parse(storedPlan));
    if (storedMessages) setChatMessages(JSON.parse(storedMessages));
    if (storedActiveModule) setActiveModule(JSON.parse(storedActiveModule));
    if (storedDocumentMode) setIsDocumentMode(JSON.parse(storedDocumentMode));
    if (storedDocumentContent) setDocumentContent(storedDocumentContent);
    */
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    // Disabling localStorage saving to reset state on refresh
    // Uncomment the below code if you want to enable persistence again
    /*
    if (userGoal) localStorage.setItem('userGoal', userGoal);
    if (userKnowledge) localStorage.setItem('userKnowledge', userKnowledge);
    if (learningPlan) localStorage.setItem('learningPlan', JSON.stringify(learningPlan));
    if (chatMessages.length) localStorage.setItem('chatMessages', JSON.stringify(chatMessages));
    if (activeModule) localStorage.setItem('activeModule', JSON.stringify(activeModule));
    localStorage.setItem('isDocumentMode', JSON.stringify(isDocumentMode));
    if (documentContent) localStorage.setItem('documentContent', documentContent);
    */
  }, [userGoal, userKnowledge, learningPlan, chatMessages, activeModule, isDocumentMode, documentContent]);

  // Function to add a new chat message to the module-specific history
  const addChatMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const newMessage: ChatMessage = {
      ...message,
      id: `${timestamp}-${randomSuffix}`,
      timestamp,
    };
    
    // If we have an active module, add the message to that module's chat history
    if (activeModule && activeModule.id) {
      setModuleChatHistories(prevHistories => {
        const moduleId = activeModule.id;
        const moduleHistory = prevHistories[moduleId] || [];
        return {
          ...prevHistories,
          [moduleId]: [...moduleHistory, newMessage]
        };
      });
    }
    
    // Also update the legacy chat messages (to be deprecated)
    setChatMessages((prevMessages) => [...prevMessages, newMessage]);
  };

  // Function to clear current module's chat messages
  const clearCurrentChatMessages = () => {
    if (activeModule && activeModule.id) {
      setModuleChatHistories(prevHistories => ({
        ...prevHistories,
        [activeModule.id]: []
      }));
    }
  };
  
  // Legacy function to clear all chat messages (to be deprecated)
  const clearChatMessages = () => {
    setChatMessages([]);
  };

  // Function to update a module's status
  const updateModuleStatus = (moduleId: string, status: Module['status']) => {
    if (!learningPlan) return;

    const updatedModules = learningPlan.modules.map((module) => {
      if (module.id === moduleId) {
        return { ...module, status };
      }
      return module;
    });

    setLearningPlan({
      ...learningPlan,
      modules: updatedModules,
    });

    // If we're setting a module to active, also update the activeModule state
    if (status === 'active') {
      const newActiveModule = updatedModules.find((module) => module.id === moduleId);
      if (newActiveModule) setActiveModule(newActiveModule);
    }
  };

  return (
    <AppContext.Provider
      value={{
        userGoal,
        setUserGoal,
        userKnowledge,
        setUserKnowledge,
        learningPlan,
        setLearningPlan,
        // Module-specific chat histories
        moduleChatHistories,
        currentChatMessages,
        addChatMessage,
        clearCurrentChatMessages,
        // Legacy chat messages (to be deprecated)
        chatMessages,
        clearChatMessages,
        activeModule,
        setActiveModule,
        updateModuleStatus,
        isGeneratingPlan,
        setIsGeneratingPlan,
        isDocumentMode,
        setIsDocumentMode,
        documentContent,
        setDocumentContent,
        moduleResources,
        setModuleResources,
        isLoadingResources,
        setIsLoadingResources,
        activeResource,
        setActiveResource,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = () => useContext(AppContext);
