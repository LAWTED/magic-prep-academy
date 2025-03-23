import { ReactElement, ReactNode } from "react";
import { LucideIcon } from "lucide-react";

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: Date;
  resumeData?: any;
  sender_id?: string;
  sender_name?: string;
  sender_avatar?: string;
}

export interface ChatPerson {
  id: string;
  name: string;
  systemPrompt: string;
  icon: LucideIcon;
  color: string;
  description: string;
  avatar?: string;
  isRealPerson?: boolean;
  welcomeMessage?: string;
}