import { apiClient } from '@/api/client'
import type { PageResponse } from '@/api/pecas'
import type {
  Manutencao,
  ManutencaoConcluirPayload,
  ManutencaoPayload,
  StatusManutencao,
  TipoManutencao,
} from '@/types/Manutencao'

export interface ManutencoesFiltro {
  page?: number
  size?: number
  status?: StatusManutencao
  tipo?: TipoManutencao
  maquinaId?: number
}

export async function buscarManutencoes(filtro: ManutencoesFiltro): Promise<PageResponse<Manutencao>> {
  const { data } = await apiClient.get<PageResponse<Manutencao>>('/manutencoes', { params: filtro })
  return data
}

export async function criarManutencao(payload: ManutencaoPayload): Promise<Manutencao> {
  const { data } = await apiClient.post<Manutencao>('/manutencoes', payload)
  return data
}

export async function iniciarManutencao(id: number): Promise<Manutencao> {
  const { data } = await apiClient.patch<Manutencao>(`/manutencoes/${id}/iniciar`)
  return data
}

export async function concluirManutencao(id: number, payload: ManutencaoConcluirPayload): Promise<Manutencao> {
  const { data } = await apiClient.patch<Manutencao>(`/manutencoes/${id}/concluir`, payload)
  return data
}
