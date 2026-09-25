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
