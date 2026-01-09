// 履歴・メッセージに関する型定義
import { Timestamp } from "firebase/firestore";

export type ChatStatus = "answered" | "not_answered" | "error";

export interface ChatMessage {
  chat_id: string;
  createdAt: Timestamp;
  tenant_id: string;
  status: ChatStatus;
  detected_categories: string[] | null;
  user_question: string;
  ai_answer: string | null;
}
