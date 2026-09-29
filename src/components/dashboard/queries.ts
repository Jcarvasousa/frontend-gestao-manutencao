import { useQueries, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { buscarManutencoes } from '@/api/manutencoes'
import { buscarPecas, buscarPecasAbaixoDoMinimo } from '@/api/pecas'
import { buscarCustoMensal, buscarCustoSetores, buscarKpis, buscarOrcamentoMensal } from '@/api/relatorios'
import type { StatusManutencao, TipoManutencao } from '@/types/Manutencao'
import type { RelatorioOrcamentoMensal } from '@/types/Relatorio'
import { janelaDe12Meses } from '@/components/dashboard/formatos'

const STALE_60S = 60_000

export const STATUS_ORDEM: StatusManutencao[] = ['ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_PECA', 'CONCLUIDA', 'CANCELADA']
export const TIPOS: TipoManutencao[] = ['CORRETIVA', 'PREVENTIVA']

export function useKpis() {
  return useQuery({ queryKey: ['relatorios', 'kpis'], queryFn: buscarKpis })
}

// Contagens via totalElements do endpoint paginado (page=0,size=1).
export function useContagemPorStatus() {
  const resultados = useQueries({
    queries: STATUS_ORDEM.map((status) => ({
      queryKey: ['manutencoes', 'contagem', 'status', status],
      queryFn: async () => (await buscarManutencoes({ status, page: 0, size: 1 })).totalElements,
    })),
  })
  const contagens = resultados.every((r) => r.data !== undefined)
    ? (Object.fromEntries(STATUS_ORDEM.map((s, i) => [s, resultados[i].data ?? 0])) as Record<StatusManutencao, number>)
    : null
  return {
    contagens,
    isPending: resultados.some((r) => r.isPending),
    isError: resultados.some((r) => r.isError),
    error: resultados.find((r) => r.isError)?.error,
    refetch: () => Promise.all(resultados.filter((r) => r.isError).map((r) => r.refetch())),
  }
}

export function useContagemPorTipo() {
  const resultados = useQueries({
    queries: TIPOS.map((tipo) => ({
      queryKey: ['manutencoes', 'contagem', 'tipo', tipo],
      queryFn: async () => (await buscarManutencoes({ tipo, page: 0, size: 1 })).totalElements,
    })),
  })
  const contagens = resultados.every((r) => r.data !== undefined)
    ? (Object.fromEntries(TIPOS.map((t, i) => [t, resultados[i].data ?? 0])) as Record<TipoManutencao, number>)
    : null
  return {
    contagens,
    isPending: resultados.some((r) => r.isPending),
    isError: resultados.some((r) => r.isError),
    error: resultados.find((r) => r.isError)?.error,
    refetch: () => Promise.all(resultados.filter((r) => r.isError).map((r) => r.refetch())),
  }
}

export function usePecasAbaixoDoMinimo() {
  return useQuery({ queryKey: ['pecas', 'abaixo-do-minimo'], queryFn: buscarPecasAbaixoDoMinimo })
}

export function useTotalCatalogo() {
  return useQuery({
    queryKey: ['pecas', 'total-catalogo'],
    queryFn: async () => (await buscarPecas({ page: 0, size: 1 })).totalElements,
  })
}

export function opcoesCustoMensal(mes: number, ano: number) {
  return {
    queryKey: ['relatorios', 'custo-mensal', ano, mes],
    queryFn: () => buscarCustoMensal(mes, ano),
    staleTime: STALE_60S,
    retry: 1,
  }
}

// Mesmas query keys do gráfico de 12 meses (o KPI reaproveita o cache).
export function useCustoMensalMeses(mes: number, ano: number) {
  const janela = janelaDe12Meses(mes, ano)
  const resultados = useQueries({ queries: janela.map((ref) => opcoesCustoMensal(ref.mes, ref.ano)) })
  return { janela, resultados }
}

export function useCustoMensal(mes: number, ano: number) {
  return useQuery(opcoesCustoMensal(mes, ano))
}

export function useCustoSetores(mes: number, ano: number) {
  return useQuery({
    queryKey: ['relatorios', 'custo-setores', ano, mes],
    queryFn: () => buscarCustoSetores({ mes, ano }),
    staleTime: STALE_60S,
    retry: 1,
  })
}

// Orçamento inexistente no mês (4xx) vira null = "sem orçamento", não erro.
export function useOrcamentoMensal(mes: number, ano: number) {
  return useQuery<RelatorioOrcamentoMensal | null>({
    queryKey: ['relatorios', 'orcamento-mensal', ano, mes],
    queryFn: async () => {
      try {
        return await buscarOrcamentoMensal(mes, ano)
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status
          if (status !== undefined && status >= 400 && status < 500 && ![401, 403, 408, 429].includes(status)) {
            return null
          }
        }
        throw error
      }
    },
  })
}
