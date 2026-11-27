import type { ProService } from "./services";

export type ChatSender = "motorist" | "professional" | "system";

export interface ChatMessage {
  id: string;
  sender: ChatSender;
  text: string;
  at: string;
  /** Optional voice note (data URL or remote URL) */
  voiceUrl?: string | null;
  /** Storage key of the uploaded audio (server messages only). */
  voiceKey?: string | null;
  voiceDurationSec?: number | null;
  voiceMime?: string | null;
  /**
   * Local delivery state. Messages from the server have none. A message the
   * sender just wrote is "sending", and stays in the chat as "failed" (with
   * retry) instead of disappearing if the send does not go through.
   */
  status?: "sending" | "failed";
}

/**
 * One job/booking conversation between a Customer and a Service Pro.
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
  /** Service pro's profile photo. */
  photo: string;
  /** Customer's profile photo. */
  motoristPhoto?: string;
  messages: ChatMessage[];
}
