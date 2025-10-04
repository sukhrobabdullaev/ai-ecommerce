import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AISystemType = "LLM_PROMPTING" | "DOMAIN_ML" | "HYBRID";

export interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  audioUrl?: string;
  messageType: "TEXT" | "AUDIO" | "PRODUCT_CARD";
  systemUsed?: AISystemType;
  modelUsed?: string;
  responseTime?: number;
  relatedProducts?: string[];
  createdAt: Date;
}

export interface ChatSession {
  id: string;
  systemType: AISystemType;
  isActive: boolean;
  messages: ChatMessage[];
  metadata?: {
    userPreferences?: Record<string, unknown>;
    context?: Record<string, unknown>;
  };
  createdAt: Date;
}

interface ChatStore {
  // Current session state
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  isLoading: boolean;
  isRecording: boolean;

  // Settings
  selectedSystem: AISystemType;
  voiceEnabled: boolean;
  language: string;

  // Research metrics
  currentTestId: string | null;
  sessionMetrics: {
    startTime: Date | null;
    messageCount: number;
    systemSwitches: number;
    userSatisfaction: number | null;
  };

  // Actions
  createSession: (systemType: AISystemType) => void;
  addMessage: (message: Omit<ChatMessage, "id" | "createdAt">) => void;
  switchSystem: (systemType: AISystemType) => void;
  setRecording: (recording: boolean) => void;
  endSession: (satisfaction?: number) => void;
  clearSessions: () => void;

  // Research actions
  startABTest: (testId: string) => void;
  logInteraction: (type: string, data: Record<string, unknown>) => void;
  setSessionMetrics: (metrics: Partial<ChatStore["sessionMetrics"]>) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSession: null,
      sessions: [],
      isLoading: false,
      isRecording: false,

      selectedSystem: "LLM_PROMPTING",
      voiceEnabled: false,
      language: "en",

      currentTestId: null,
      sessionMetrics: {
        startTime: null,
        messageCount: 0,
        systemSwitches: 0,
        userSatisfaction: null,
      },

      // Actions
      createSession: (systemType) => {
        const session: ChatSession = {
          id: `session_${Date.now()}`,
          systemType,
          isActive: true,
          messages: [],
          createdAt: new Date(),
        };

        set({
          currentSession: session,
          sessions: [session, ...get().sessions],
          sessionMetrics: {
            startTime: new Date(),
            messageCount: 0,
            systemSwitches: 0,
            userSatisfaction: null,
          },
        });
      },

      addMessage: (message) => {
        const currentSession = get().currentSession;
        if (!currentSession) return;

        const newMessage: ChatMessage = {
          ...message,
          id: `msg_${Date.now()}`,
          createdAt: new Date(),
        };

        const updatedSession = {
          ...currentSession,
          messages: [...currentSession.messages, newMessage],
        };

        set({
          currentSession: updatedSession,
          sessions: get().sessions.map((s) =>
            s.id === currentSession.id ? updatedSession : s
          ),
          sessionMetrics: {
            ...get().sessionMetrics,
            messageCount: get().sessionMetrics.messageCount + 1,
          },
        });
      },

      switchSystem: (systemType) => {
        const currentSession = get().currentSession;
        if (currentSession && currentSession.systemType !== systemType) {
          set({
            sessionMetrics: {
              ...get().sessionMetrics,
              systemSwitches: get().sessionMetrics.systemSwitches + 1,
            },
          });
        }

        set({
          selectedSystem: systemType,
          currentSession: currentSession
            ? {
                ...currentSession,
                systemType,
              }
            : null,
        });
      },

      setRecording: (recording) => set({ isRecording: recording }),

      endSession: (satisfaction) => {
        const currentSession = get().currentSession;
        if (!currentSession) return;

        const updatedSession = {
          ...currentSession,
          isActive: false,
        };

        set({
          currentSession: null,
          sessions: get().sessions.map((s) =>
            s.id === currentSession.id ? updatedSession : s
          ),
          sessionMetrics: {
            ...get().sessionMetrics,
            userSatisfaction: satisfaction || null,
          },
        });
      },

      clearSessions: () => set({ sessions: [], currentSession: null }),

      startABTest: (testId) => set({ currentTestId: testId }),

      logInteraction: async (type, data) => {
        // Log interaction to backend for research
        try {
          await fetch("/api/research/interactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type,
              data,
              sessionId: get().currentSession?.id,
              systemUsed: get().selectedSystem,
              testId: get().currentTestId,
            }),
          });
        } catch (error) {
          console.error("Failed to log interaction:", error);
        }
      },

      setSessionMetrics: (metrics) =>
        set({
          sessionMetrics: { ...get().sessionMetrics, ...metrics },
        }),
    }),
    {
      name: "chat-store",
      partialize: (state) => ({
        sessions: state.sessions,
        selectedSystem: state.selectedSystem,
        voiceEnabled: state.voiceEnabled,
        language: state.language,
      }),
    }
  )
);
