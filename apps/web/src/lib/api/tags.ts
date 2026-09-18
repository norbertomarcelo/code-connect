import { apiClient } from './client'
import type { TagSummary } from './types'

/** GET /tags -> 200 */
export async function listTags(): Promise<TagSummary[]> {
  const { data } = await apiClient.get<TagSummary[]>('/tags')
  return data
}
