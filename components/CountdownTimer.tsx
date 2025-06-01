import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  timeConstraint: string;
  onTimeUp?: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ timeConstraint, onTimeUp }) => {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  const [isRunning, setIsRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  
  // Parse the time constraint string to get total hours
  useEffect(() => {
    let totalHours = 24; // Default to 24 hours
    
    if (timeConstraint.includes('hour')) {
      const match = timeConstraint.match(/(\d+)\s*hours?/);
      if (match && match[1]) {
        totalHours = parseInt(match[1], 10);
      }
    } else if (timeConstraint.includes('day')) {
      const match = timeConstraint.match(/(\d+)\s*days?/);
      if (match && match[1]) {
        totalHours = parseInt(match[1], 10) * 24;
      }
    } else if (timeConstraint.includes('week')) {
      const match = timeConstraint.match(/(\d+)\s*weeks?/);
      if (match && match[1]) {
        totalHours = parseInt(match[1], 10) * 24 * 7;
      }
    }
    
    // Set initial time remaining
    const totalSeconds = totalHours * 60 * 60;
    const days = Math.floor(totalSeconds / (60 * 60 * 24));
    const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    
    setTimeRemaining({ days, hours, minutes, seconds });
    
    // Store end time in localStorage
    const endTime = Date.now() + totalSeconds * 1000;
    localStorage.setItem('examPrepEndTime', endTime.toString());
    
  }, [timeConstraint]);
  
  // Countdown timer effect
  useEffect(() => {
    if (!isRunning || isPaused) return;
    
    // Check if there's a stored end time
    const storedEndTime = localStorage.getItem('examPrepEndTime');
    let endTime = storedEndTime ? parseInt(storedEndTime, 10) : 0;
    
    // If no valid end time, calculate it based on current time remaining
    if (!endTime || endTime < Date.now()) {
      const totalSeconds = 
        timeRemaining.days * 24 * 60 * 60 + 
        timeRemaining.hours * 60 * 60 + 
        timeRemaining.minutes * 60 + 
        timeRemaining.seconds;
      
      endTime = Date.now() + totalSeconds * 1000;
      localStorage.setItem('examPrepEndTime', endTime.toString());
    }
    
    const timer = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, endTime - now);
      
      if (diff <= 0) {
        // Time's up
        clearInterval(timer);
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsRunning(false);
        if (onTimeUp) onTimeUp();
        return;
      }
      
      // Calculate remaining time
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining({ days, hours, minutes, seconds });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isRunning, isPaused, timeRemaining, onTimeUp]);
  
  // Format time with leading zeros
  const formatTime = (value: number): string => {
    return value.toString().padStart(2, '0');
  };
  
  // Toggle pause/resume
  const togglePause = () => {
    setIsPaused(!isPaused);
  };
  
  // Reset timer
  const resetTimer = () => {
    localStorage.removeItem('examPrepEndTime');
    setIsRunning(true);
    setIsPaused(false);
    
    // Re-parse the time constraint
    let totalHours = 24;
    if (timeConstraint.includes('hour')) {
      const match = timeConstraint.match(/(\d+)\s*hours?/);
      if (match && match[1]) {
        totalHours = parseInt(match[1], 10);
      }
    } else if (timeConstraint.includes('day')) {
      const match = timeConstraint.match(/(\d+)\s*days?/);
      if (match && match[1]) {
        totalHours = parseInt(match[1], 10) * 24;
      }
    } else if (timeConstraint.includes('week')) {
      const match = timeConstraint.match(/(\d+)\s*weeks?/);
      if (match && match[1]) {
        totalHours = parseInt(match[1], 10) * 24 * 7;
      }
    }
    
    const totalSeconds = totalHours * 60 * 60;
    const days = Math.floor(totalSeconds / (60 * 60 * 24));
    const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    
    setTimeRemaining({ days, hours, minutes, seconds });
    
    // Store new end time
    const endTime = Date.now() + totalSeconds * 1000;
    localStorage.setItem('examPrepEndTime', endTime.toString());
  };
  
  // Determine urgency level for styling
  const getUrgencyLevel = () => {
    const totalHours = 
      timeRemaining.days * 24 + 
      timeRemaining.hours + 
      timeRemaining.minutes / 60;
    
    if (totalHours < 3) return 'high';
    if (totalHours < 12) return 'medium';
    return 'low';
  };
  
  const urgency = getUrgencyLevel();
  const urgencyColors = {
    high: 'bg-red-600 border-red-700',
    medium: 'bg-orange-500 border-orange-600',
    low: 'bg-green-500 border-green-600'
  };
  
  return (
    <div className={`countdown-timer p-3 rounded-lg border-2 ${urgencyColors[urgency as keyof typeof urgencyColors]} text-white`}>
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-bold mb-2">Time Remaining</h3>
        
        <div className="grid grid-cols-4 gap-2 text-center mb-3">
          <div className="flex flex-col">
            <div className="text-2xl font-mono font-bold">{formatTime(timeRemaining.days)}</div>
            <div className="text-xs">Days</div>
          </div>
          <div className="flex flex-col">
            <div className="text-2xl font-mono font-bold">{formatTime(timeRemaining.hours)}</div>
            <div className="text-xs">Hours</div>
          </div>
          <div className="flex flex-col">
            <div className="text-2xl font-mono font-bold">{formatTime(timeRemaining.minutes)}</div>
            <div className="text-xs">Mins</div>
          </div>
          <div className="flex flex-col">
            <div className="text-2xl font-mono font-bold">{formatTime(timeRemaining.seconds)}</div>
            <div className="text-xs">Secs</div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={togglePause} 
            className="px-3 py-1 text-sm bg-white text-gray-800 rounded hover:bg-gray-100 transition-colors"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button 
            onClick={resetTimer} 
            className="px-3 py-1 text-sm bg-white text-gray-800 rounded hover:bg-gray-100 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
