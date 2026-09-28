import { apiClient } from '@/api/client'
import type { Setor, SetorPayload } from '@/types/Setor'

export interface SetoresFiltro {
  ativo?: boolean
}

export async function buscarSetores(filtro?: SetoresFiltro): Promise<Setor[]> {
  const { data } = await apiClient.get<Setor[]>('/setores', { params: filtro })
  return data
}

export async function criarSetor(payload: SetorPayload): Promise<Setor> {
  const { data } = await apiClient.post<Setor>('/setores', payload)
  return data
}

export async function atualizarSetor(id: number, payload: SetorPayload): Promise<Setor> {
  const { data } = await apiClient.put<Setor>(`/setores/${id}`, payload)
  return data
}
