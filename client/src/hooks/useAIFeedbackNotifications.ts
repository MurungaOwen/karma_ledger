import { useEffect, useRef } from 'react';
import { apiClient } from '../services/api';
import { useToast } from '../contexts/ToastContext';

export const useAIFeedbackNotifications = () => {
  const { showToast } = useToast();
  const processingEventsRef = useRef<Set<string>>(new Set());
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addProcessingEvent = (eventId: string) => {
    processingEventsRef.current.add(eventId);
    startPolling();
  };

  const startPolling = () => {
    if (checkIntervalRef.current) return; // Already polling
    
    checkIntervalRef.current = setInterval(() => {
      checkFeedbackStatus();
    }, 10000); // Check every 10 seconds
  };

  const stopPolling = () => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
  };

  const checkFeedbackStatus = async () => {
    if (processingEventsRef.current.size === 0) {
      stopPolling();
      return;
    }

    try {
      const events = await apiClient.getMyKarmaEvents();
      const processingIds = Array.from(processingEventsRef.current);
      
      for (const eventId of processingIds) {
        const event = events.find(e => e.event_id === eventId);
        
        if (event && event.feedback_generated && event.feedback) {
          // Remove from processing set
          processingEventsRef.current.delete(eventId);
          
          // Show completion notification
          showToast({
            type: 'success',
            title: 'AI Analysis Complete!',
            message: `Your karma event "${event.action}" has been analyzed and feedback is ready.`,
            duration: 6000
          });
        }
      }
      
      // Stop polling if no more events to check
      if (processingEventsRef.current.size === 0) {
        stopPolling();
      }
    } catch (error) {
      console.error('Error checking feedback status:', error);
    }
  };

  const notifyEventCreated = (eventId: string) => {
    addProcessingEvent(eventId);
  };

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  return {
    notifyEventCreated,
    checkFeedbackStatus
  };
};