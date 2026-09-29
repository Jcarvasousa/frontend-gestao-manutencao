export type ModoPeriodo = 'mensal' | 'anual' | 'total'

export const ROTULOS_MODO_PERIODO: Record<ModoPeriodo, string> = {
  mensal: 'Mensal',
  anual: 'Anual',
  total: 'Total',
}

export interface PeriodoResolvido {
  erro: string | null
  mes?: number
  ano?: number
}

// mes/ano vazios ('') indicam campo não preenchido.
export function resolverPeriodo(modo: ModoPeriodo, mes: number | '', ano: number | ''): PeriodoResolvido {
  if (modo === 'mensal') {
    if (mes === '' || ano === '') return { erro: 'Informe o mês e o ano para o relatório mensal.' }
    return { erro: null, mes, ano }
  }
  if (modo === 'anual') {
    if (ano === '') return { erro: 'Informe o ano para o relatório anual.' }
    return { erro: null, ano }
  }
  return { erro: null }
}
