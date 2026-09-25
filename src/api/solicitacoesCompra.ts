import { apiClient } from '@/api/client'
import type { PageResponse } from '@/api/pecas'
import type {
  SolicitacaoCompra,
  SolicitacaoCompraPayload,
  StatusSolicitacaoCompra,
} from '@/types/SolicitacaoCompra'

export interface SolicitacoesCompraFiltro {
  page?: number
  size?: number
  status?: StatusSolicitacaoCompra
  pecaId?: number
}

export async function buscarSolicitacoes(
  filtro: SolicitacoesCompraFiltro,
): Promise<PageResponse<SolicitacaoCompra>> {
  const { data } = await apiClient.get<PageResponse<SolicitacaoCompra>>('/solicitacoes-compra', {
    params: filtro,
  })
  return data
}

export async function criarSolicitacao(payload: SolicitacaoCompraPayload): Promise<SolicitacaoCompra> {
  const { data } = await apiClient.post<SolicitacaoCompra>('/solicitacoes-compra', payload)
  return data
}

export async function marcarComoRecebida(id: number): Promise<SolicitacaoCompra> {
  const { data } = await apiClient.patch<SolicitacaoCompra>(`/solicitacoes-compra/${id}/receber`)
  return data
}
