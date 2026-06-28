export type AiChatMessageRole = "user" | "assistant";

export interface AiChatMessagePayload {
  id: number;
  role: AiChatMessageRole;
  content: string;
  createdAt: string;
}

export interface AiChatMessagesResponse {
  messages: AiChatMessagePayload[];
}

export interface AiChatSendRequest {
  content: string;
}

export interface AiChatSendResponse {
  userMessage: AiChatMessagePayload;
  assistantMessage: AiChatMessagePayload;
}
