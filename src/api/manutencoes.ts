import { apiClient } from '@/api/client'
import type { PageResponse } from '@/api/pecas'
import type {
  Manutencao,
  ManutencaoConcluirPayload,
  ManutencaoPayload,
  ManutencaoTecnico,
  ManutencaoTecnicoPayload,
  PecaUsada,
  ServicoTerceiro,
  ServicoTerceiroAtualizacaoPayload,
  ServicoTerceiroPayload,
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

export async function buscarManutencao(id: number): Promise<Manutencao> {
  const { data } = await apiClient.get<Manutencao>(`/manutencoes/${id}`)
  return data
}

export async function cancelarManutencao(id: number): Promise<Manutencao> {
  const { data } = await apiClient.patch<Manutencao>(`/manutencoes/${id}/cancelar`)
  return data
}

export async function buscarPecasUsadas(id: number): Promise<PecaUsada[]> {
  const { data } = await apiClient.get<PecaUsada[]>(`/manutencoes/${id}/pecas-usadas`)
  return data
}

export async function buscarTecnicosDaManutencao(id: number): Promise<ManutencaoTecnico[]> {
  const { data } = await apiClient.get<ManutencaoTecnico[]>(`/manutencoes/${id}/tecnicos`)
  return data
}

export async function vincularTecnico(id: number, payload: ManutencaoTecnicoPayload): Promise<ManutencaoTecnico> {
  const { data } = await apiClient.post<ManutencaoTecnico>(`/manutencoes/${id}/tecnicos`, payload)
  return data
}

export async function removerTecnico(id: number, vinculoId: number): Promise<void> {
  await apiClient.delete(`/manutencoes/${id}/tecnicos/${vinculoId}`)
}

export async function buscarServicosTerceiros(manutencaoId: number): Promise<ServicoTerceiro[]> {
  const { data } = await apiClient.get<PageResponse<ServicoTerceiro>>('/servicos-terceiros', {
    params: { manutencaoId, page: 0, size: 100 },
  })
  return data.content
}

export async function criarServicoTerceiro(payload: ServicoTerceiroPayload): Promise<ServicoTerceiro> {
  const { data } = await apiClient.post<ServicoTerceiro>('/servicos-terceiros', payload)
  return data
}

export async function atualizarServicoTerceiro(
  id: number,
  payload: ServicoTerceiroAtualizacaoPayload,
): Promise<ServicoTerceiro> {
  const { data } = await apiClient.put<ServicoTerceiro>(`/servicos-terceiros/${id}`, payload)
  return data
}

export async function removerServicoTerceiro(id: number): Promise<void> {
  await apiClient.delete(`/servicos-terceiros/${id}`)
}

export async function concluirManutencao(id: number, payload: ManutencaoConcluirPayload): Promise<Manutencao> {
  const { data } = await apiClient.patch<Manutencao>(`/manutencoes/${id}/concluir`, payload)
  return data
}
