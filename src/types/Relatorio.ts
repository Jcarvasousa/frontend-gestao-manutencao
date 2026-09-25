export interface RelatorioCustoMensal {
  mes: number
  ano: number
  custoPecas: number
  custoMaoDeObra: number
  custoTotal: number
}

export interface RelatorioCustoMaquina {
  maquinaId: number
  maquinaCodigo: string
  mes: number | null
  ano: number | null
  custoPecas: number
  custoMaoDeObra: number
  custoTotal: number
}

export interface RelatorioOrcamentoMensal {
  mes: number
  ano: number
  valorPlanejado: number
  valorRealizado: number
  saldoDisponivel: number
  percentualUtilizado: number
}

export interface RelatorioOrcamentoAnual {
  ano: number
  valorPlanejadoTotal: number
  valorRealizadoTotal: number
  saldoDisponivel: number
  percentualUtilizado: number
}

export interface RelatorioGastoRealizado {
  mes: number
  ano: number
  valorGasto: number
}
