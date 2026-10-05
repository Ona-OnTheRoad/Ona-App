import type { ProService } from "./services";

export type ChatSender = "motorist" | "professional" | "system";

export interface ChatMessage {
  id: string;
  sender: ChatSender;
  text: string;
  at: string;
  /** Optional voice note (data URL or remote URL) */
  voiceUrl?: string | null;
  voiceDurationSec?: number | null;
  voiceMime?: string | null;
}

/**
 * One job/booking conversation between a Customer and a Repair Pro.
 * Threads never mix roles or jobs.
 */
export interface MessageThread {
  id: string;
  /** Linked service request when chat started from a job */
  requestId?: string;
  technicianId: string;
  technicianName: string;
  motoristName: string;
  serviceType: ProService;
  lastMessage: string;
  time: string;
  unread: number;
  photo: string;
  messages: ChatMessage[];
}
