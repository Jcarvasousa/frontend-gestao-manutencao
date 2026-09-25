import { apiClient } from '@/api/client'
import type { PageResponse } from '@/api/pecas'
import type { Maquina, MaquinaPayload, StatusMaquina } from '@/types/Maquina'

export interface MaquinasFiltro {
  page?: number
  size?: number
  status?: StatusMaquina
  setor?: string
  codigo?: string
}

export async function buscarMaquinas(filtro: MaquinasFiltro): Promise<PageResponse<Maquina>> {
  const { data } = await apiClient.get<PageResponse<Maquina>>('/maquinas', { params: filtro })
  return data
}

export async function criarMaquina(payload: MaquinaPayload): Promise<Maquina> {
  const { data } = await apiClient.post<Maquina>('/maquinas', payload)
  return data
}

export async function atualizarMaquina(id: number, payload: MaquinaPayload): Promise<Maquina> {
  const { data } = await apiClient.put<Maquina>(`/maquinas/${id}`, payload)
  return data
}

export async function atualizarStatusMaquina(id: number, status: StatusMaquina): Promise<Maquina> {
  const { data } = await apiClient.patch<Maquina>(`/maquinas/${id}/status`, { status })
  return data
}
