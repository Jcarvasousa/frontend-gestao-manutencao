import { apiClient } from '@/api/client'
import type { PageResponse } from '@/api/pecas'
import type { Tecnico, TecnicoPayload } from '@/types/Tecnico'

export interface TecnicosFiltro {
  page?: number
  size?: number
  nome?: string
}

export async function buscarTecnicos(filtro: TecnicosFiltro): Promise<PageResponse<Tecnico>> {
  const { data } = await apiClient.get<PageResponse<Tecnico>>('/tecnicos', { params: filtro })
  return data
}

export async function criarTecnico(payload: TecnicoPayload): Promise<Tecnico> {
  const { data } = await apiClient.post<Tecnico>('/tecnicos', payload)
  return data
}

export async function atualizarTecnico(id: number, payload: TecnicoPayload): Promise<Tecnico> {
  const { data } = await apiClient.put<Tecnico>(`/tecnicos/${id}`, payload)
  return data
}
