import { useState, useEffect } from 'react';

interface SSEventPayload {
  seatNo?: string;
  status?: 'booked' | 'held' | 'available';
  availableTickets?: number;
  message?: string;
  type?: string;
}

export const useTicketEvents = (userId: string, onEvent?: (payload: SSEventPayload) => void) => {
  const [events, setEvents] = useState<SSEventPayload[]>([]);

  useEffect(() => {
    // Kết nối tới SSE endpoint
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333';
    const eventSource = new EventSource(`${apiBaseUrl.replace(/\/$/, '')}/booking/sse/${userId}`);

    eventSource.onmessage = (event) => {
      const parsedData: SSEventPayload = JSON.parse(event.data);
      setEvents((prev) => [...prev, parsedData]);
      
      if (onEvent) {
        onEvent(parsedData);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [userId]);

  return { lastEvent: events[events.length - 1] || null };
};
