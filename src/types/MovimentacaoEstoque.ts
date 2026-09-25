export type TipoMovimentacao = 'ENTRADA' | 'SAIDA'

export interface MovimentacaoEstoque {
	id: number
	pecaId: number
	pecaCodigo: string
	manutencaoId: number | null
	tipo: TipoMovimentacao
	quantidade: number
	custoUnitarioMomento: number | null
	observacao: string | null
	dataHora: string
}

export interface MovimentacaoEntradaPayload {
	pecaId: number
	quantidade: number
	observacao: string | null
}

export interface MovimentacaoSaidaPayload {
	pecaId: number
	manutencaoId: number
	quantidade: number
	observacao: string | null
}
