"use client";

import {
  createContext, useCallback, useContext, useEffect, useRef,
} from "react";

export interface AdminSSEEvent {
  type:       string;
  ts?:        number;
  id?:        number;
  reference?: string;
  nom?:       string;
  total?:     number;
  created_at?: string;
  [key: string]: unknown;
}

type Handler = (event: AdminSSEEvent) => void;

interface SSEContextValue {
  subscribe: (handler: Handler) => () => void;
}

const AdminSSEContext = createContext<SSEContextValue>({ subscribe: () => () => {} });

export function AdminSSEProvider({ children }: { children: React.ReactNode }) {
  const esRef         = useRef<EventSource | null>(null);
  const handlersRef   = useRef<Set<Handler>>(new Set());
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function connect() {
      if (esRef.current) { esRef.current.close(); esRef.current = null; }

      const es = new EventSource("/api/admin/sse");
      esRef.current = es;

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as AdminSSEEvent;
          if (data.type === "reconnect") {
            // Server-initiated graceful close — reconnect immediately
            es.close();
            esRef.current = null;
            connect();
            return;
          }
          handlersRef.current.forEach(h => h(data));
        } catch { /* ignore malformed frame */ }
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;
        retryTimerRef.current = setTimeout(connect, 5_000);
      };
    }

    connect();

    return () => {
      esRef.current?.close();
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  const subscribe = useCallback((handler: Handler) => {
    handlersRef.current.add(handler);
    return () => { handlersRef.current.delete(handler); };
  }, []);

  return (
    <AdminSSEContext.Provider value={{ subscribe }}>
      {children}
    </AdminSSEContext.Provider>
  );
}

export function useAdminSSE() {
  return useContext(AdminSSEContext);
}
