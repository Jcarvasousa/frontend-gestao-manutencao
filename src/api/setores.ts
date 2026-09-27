import { apiClient } from '@/api/client'
import type { Setor } from '@/types/Setor'

export async function buscarSetores(): Promise<Setor[]> {
  const { data } = await apiClient.get<Setor[]>('/setores')
  return data
}
