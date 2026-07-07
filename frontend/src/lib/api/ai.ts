import { apiClient } from '@/lib/api/client'
import { ChatResponseSchema } from '@/lib/api/schemas'
import type { z } from 'zod'

export interface ChatHistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

export type PendingDelete = NonNullable<z.infer<typeof ChatResponseSchema>['pendingDelete']>
export type ChatResponse = z.infer<typeof ChatResponseSchema>

export async function sendChatMessage(
  message: string,
  history: ChatHistoryMessage[],
  projectId: string | null,
): Promise<ChatResponse> {
  const { data } = await apiClient.post('/api/ai/chat', {
    message,
    history,
    ...(projectId ? { projectId } : {}),
  })
  return ChatResponseSchema.parse(data)
}
