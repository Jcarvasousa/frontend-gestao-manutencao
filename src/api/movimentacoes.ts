import { apiClient } from '@/api/client'
import type { PageResponse } from '@/api/pecas'
import type {
  MovimentacaoEntradaPayload,
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

export async function registrarEntrada(payload: MovimentacaoEntradaPayload): Promise<MovimentacaoEstoque> {
  const { data } = await apiClient.post<MovimentacaoEstoque>('/movimentacoes-estoque/entrada', payload)
  return data
}

export async function registrarSaida(payload: MovimentacaoSaidaPayload): Promise<MovimentacaoEstoque> {
  const { data } = await apiClient.post<MovimentacaoEstoque>('/movimentacoes-estoque/saida', payload)
  return data
}
