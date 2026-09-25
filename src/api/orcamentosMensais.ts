import { apiClient } from '@/api/client'
import type { OrcamentoMensal, OrcamentoMensalPayload } from '@/types/OrcamentoMensal'

export async function buscarOrcamentosPorAno(ano: number): Promise<OrcamentoMensal[]> {
  const { data } = await apiClient.get<OrcamentoMensal[]>(`/orcamentos-mensais/ano/${ano}`)
  return data
}

export async function criarOrcamento(payload: OrcamentoMensalPayload): Promise<OrcamentoMensal> {
  const { data } = await apiClient.post<OrcamentoMensal>('/orcamentos-mensais', payload)
  return data
}

export async function atualizarOrcamento(mes: number, ano: number, valorPlanejado: number): Promise<OrcamentoMensal> {
  const payload: OrcamentoMensalPayload = { mes, ano, valorPlanejado }
  const { data } = await apiClient.put<OrcamentoMensal>(`/orcamentos-mensais/${mes}/${ano}`, payload)
  return data
}
