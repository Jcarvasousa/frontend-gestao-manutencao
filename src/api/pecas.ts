import { apiClient } from '@/api/client'
import type { Peca, PecaPayload } from '@/types/Peca'

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

export interface PecasFiltro {
  page?: number
  size?: number
  categoria?: string
  codigo?: string
}

export async function buscarPecas(filtro: PecasFiltro): Promise<PageResponse<Peca>> {
  const { data } = await apiClient.get<PageResponse<Peca>>('/pecas', { params: filtro })
  return data
}

export async function criarPeca(payload: PecaPayload): Promise<Peca> {
  const { data } = await apiClient.post<Peca>('/pecas', payload)
  return data
}

export async function atualizarPeca(id: number, payload: PecaPayload): Promise<Peca> {
  const { data } = await apiClient.put<Peca>(`/pecas/${id}`, payload)
  return data
}
