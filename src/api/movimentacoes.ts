import { apiClient } from '@/api/client'
import type { PageResponse } from '@/api/pecas'
import type {
  MovimentacaoAjustePayload,
  MovimentacaoDevolucaoPayload,
  MovimentacaoEstoque,
  MovimentacaoSaidaPayload,
  TipoMovimentacao,
} from '@/types/MovimentacaoEstoque'

export interface MovimentacoesFiltro {
  page?: number
  size?: number
  tipo?: TipoMovimentacao
  pecaId?: number
  manutencaoId?: number
}

export async function buscarMovimentacoes(filtro: MovimentacoesFiltro): Promise<PageResponse<MovimentacaoEstoque>> {
  const { data } = await apiClient.get<PageResponse<MovimentacaoEstoque>>('/movimentacoes-estoque', { params: filtro })
  return data
}

export async function registrarSaida(payload: MovimentacaoSaidaPayload): Promise<MovimentacaoEstoque> {
  const { data } = await apiClient.post<MovimentacaoEstoque>('/movimentacoes-estoque/saida', payload)
  return data
}

export async function registrarDevolucao(payload: MovimentacaoDevolucaoPayload): Promise<MovimentacaoEstoque[]> {
  const { data } = await apiClient.post<MovimentacaoEstoque[]>('/movimentacoes-estoque/devolucao', payload)
  return data
}

export async function registrarAjuste(payload: MovimentacaoAjustePayload): Promise<MovimentacaoEstoque> {
  const { data } = await apiClient.post<MovimentacaoEstoque>('/movimentacoes-estoque/ajuste', payload)
  return data
}
