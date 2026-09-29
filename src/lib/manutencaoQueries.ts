import type { QueryClient } from '@tanstack/react-query'

// Registrar/remover/devolver/cancelar afetam manutenções (inclui as chaves do painel:
// ['manutencoes', 'detalhe' | 'pecas-usadas' | 'tecnicos' | 'terceiros', id]), estoque,
// movimentações e relatórios (custos e KPIs).
export function invalidarDadosDeManutencao(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['manutencoes'] }),
    queryClient.invalidateQueries({ queryKey: ['pecas'] }),
    queryClient.invalidateQueries({ queryKey: ['movimentacoes'] }),
    queryClient.invalidateQueries({ queryKey: ['relatorios'] }),
  ])
}

export const manutencaoKeys = {
  detalhe: (id: number) => ['manutencoes', 'detalhe', id] as const,
  pecasUsadas: (id: number) => ['manutencoes', 'pecas-usadas', id] as const,
  tecnicos: (id: number) => ['manutencoes', 'tecnicos', id] as const,
  terceiros: (id: number) => ['manutencoes', 'terceiros', id] as const,
}
