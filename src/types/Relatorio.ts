export interface RelatorioCustoMensal {
  mes: number
  ano: number
  custoPecas: number
  custoMaoDeObra: number
  custoTotal: number
}

export interface RelatorioCustoMaquinaItem {
  maquinaId: number
  maquinaCodigo: string
  mes: number | null
  ano: number | null
  custoPecas: number
  custoMaoDeObra: number
  custoTotal: number
}

export interface RelatorioCustoMaquinas {
  maquinas: RelatorioCustoMaquinaItem[]
  totalGeral: number
}

export interface RelatorioCustoSetorItem {
  setorId: number | null
  setorNome: string
  ativo: boolean
  quantidadeMaquinas: number
  custoPecas: number
  custoMaoDeObra: number
  custoTotal: number
  percentualDoTotal: number
}

export interface RelatorioCustoSetores {
  mes: number | null
  ano: number | null
  setores: RelatorioCustoSetorItem[]
  totalGeral: number
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

export interface RelatorioKpis {
  backlogQuantidade: number
  mttrHoras: number | null
}

export interface RelatorioGastoRealizado {
  mes: number
  ano: number
  valorGastoPecas: number
  valorGastoServicoTerceiro: number
  valorGastoTotal: number
}
