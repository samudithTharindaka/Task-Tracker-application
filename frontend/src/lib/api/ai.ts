import { apiClient } from '@/lib/api/client'

export interface ChatHistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface PendingDelete {
  taskId: string
  title: string
}

export interface ChatResponse {
  reply: string
  pendingDelete?: PendingDelete | null
  mutated: boolean
}

export async function sendChatMessage(
  message: string,
  history: ChatHistoryMessage[],
  projectId: string | null,
): Promise<ChatResponse> {
  const { data } = await apiClient.post<ChatResponse>('/api/ai/chat', {
    message,
    history,
    ...(projectId ? { projectId } : {}),
  })
  return data
}
