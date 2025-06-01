import React, { useState } from 'react';
import { Module } from '../lib/context';

interface PracticeQuestionsProps {
  module: Module;
}

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  userAnswer?: number;
}

const PracticeQuestions: React.FC<PracticeQuestionsProps> = ({ module }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Generate practice questions for the current module
  const generateQuestions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate-practice-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleId: module.id,
          moduleTitle: module.title,
          moduleDescription: module.description,
          keyConceptsPreview: module.keyConceptsPreview,
          count: 5 // Generate 5 questions
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate practice questions');
      }
      
      const data = await response.json();
      
      if (data.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions.map((q: any, index: number) => ({
          ...q,
          id: `question-${module.id}-${index}`
        })));
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error generating practice questions:', err);
      setError('Failed to generate practice questions. Please try again.');
      
      // For demo purposes, generate sample questions if API fails
      setQuestions(getSampleQuestions(module));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle user selecting an answer
  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    if (showResults) return; // Don't allow changes after submission
    
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, userAnswer: optionIndex } 
        : q
    ));
  };
  
  // Submit answers and show results
  const handleSubmit = () => {
    setShowResults(true);
  };
  
  // Reset the quiz
  const handleReset = () => {
    setShowResults(false);
    setQuestions(questions.map(q => ({ ...q, userAnswer: undefined })));
  };
  
  // Calculate score
  const calculateScore = () => {
    const answeredQuestions = questions.filter(q => q.userAnswer !== undefined);
    if (answeredQuestions.length === 0) return 0;
    
    const correctAnswers = answeredQuestions.filter(q => q.userAnswer === q.correctAnswer);
    return Math.round((correctAnswers.length / answeredQuestions.length) * 100);
  };
  
  // Sample questions for demo purposes
  const getSampleQuestions = (module: Module): Question[] => {
    return [
      {
        id: `question-${module.id}-1`,
        text: `What is the main focus of "${module.title}"?`,
        options: [
          'Understanding core concepts',
          'Memorizing definitions',
          'Practical applications',
          'Historical context'
        ],
        correctAnswer: 0,
        explanation: 'The main focus is understanding core concepts as they form the foundation for more advanced topics.'
      },
      {
        id: `question-${module.id}-2`,
        text: 'Which of the following best describes a key learning outcome from this module?',
        options: [
          'Ability to recite facts',
          'Critical thinking and problem solving',
          'Memorization of formulas',
          'Speed of calculation'
        ],
        correctAnswer: 1,
        explanation: 'Critical thinking and problem solving are essential skills developed in this module.'
      },
      {
        id: `question-${module.id}-3`,
        text: 'In a typical exam question on this topic, what would you be asked to do?',
        options: [
          'Compare and contrast concepts',
          'List definitions in order',
          'Solve a practical problem',
          'Describe historical development'
        ],
        correctAnswer: 2,
        explanation: 'Exam questions typically focus on applying knowledge to solve practical problems.'
      }
    ];
  };
  
  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-xl font-bold mb-4">Practice Questions</h3>
        <p className="mb-4">Test your knowledge on {module.title} with practice questions.</p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <button
          onClick={generateQuestions}
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          {isLoading ? 'Generating...' : 'Generate Practice Questions'}
        </button>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-xl font-bold mb-4">Practice Questions: {module.title}</h3>
      
      {showResults && (
        <div className={`mb-6 p-4 rounded-lg ${calculateScore() >= 70 ? 'bg-green-100' : 'bg-orange-100'}`}>
          <h4 className="font-bold text-lg">Your Score: {calculateScore()}%</h4>
          <p>{calculateScore() >= 70 ? 'Great job! You\'re well prepared.' : 'Keep studying! Review the explanations below.'}</p>
        </div>
      )}
      
      <div className="space-y-6">
        {questions.map((question, qIndex) => (
          <div key={question.id} className="border rounded-lg p-4">
            <h4 className="font-bold mb-2">Question {qIndex + 1}: {question.text}</h4>
            
            <div className="space-y-2 mb-4">
              {question.options.map((option, oIndex) => (
                <div 
                  key={`${question.id}-option-${oIndex}`}
                  onClick={() => handleAnswerSelect(question.id, oIndex)}
                  className={`p-3 rounded-lg cursor-pointer border ${
                    question.userAnswer === oIndex 
                      ? showResults 
                        ? question.correctAnswer === oIndex 
                          ? 'bg-green-100 border-green-500' 
                          : 'bg-red-100 border-red-500'
                        : 'bg-blue-100 border-blue-500'
                      : showResults && question.correctAnswer === oIndex
                        ? 'bg-green-50 border-green-500'
                        : 'hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="mr-2">{String.fromCharCode(65 + oIndex)}.</div>
                    <div>{option}</div>
                  </div>
                </div>
              ))}
            </div>
            
            {showResults && (
              <div className="mt-2 text-sm bg-gray-50 p-3 rounded">
                <p className="font-bold">Explanation:</p>
                <p>{question.explanation}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex space-x-4">
        {!showResults ? (
          <button
            onClick={handleSubmit}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Submit Answers
          </button>
        ) : (
          <button
            onClick={handleReset}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Try Again
          </button>
        )}
        
        <button
          onClick={generateQuestions}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Generate New Questions
        </button>
      </div>
    </div>
  );
};

export default PracticeQuestions;
