export type StatusSolicitacaoCompra =
	| 'AGUARDANDO_ORCAMENTO'
	| 'APROVADA'
	| 'PEDIDO_REALIZADO'
	| 'RECEBIDA'
	| 'CANCELADA'

export interface SolicitacaoCompra {
	id: number
	pecaId: number
	pecaCodigo: string
	pecaNome: string
	manutencaoId: number | null
	quantidadeNecessaria: number
	status: StatusSolicitacaoCompra
	fornecedor: string | null
	valorOrcamento: number | null
	dataSolicitacao: string
	dataPrevisaoEntrega: string | null
	dataRecebimento: string | null
}

export interface SolicitacaoCompraPayload {
	pecaId: number
	manutencaoId: number | null
	quantidadeNecessaria: number
	fornecedor: string | null
	valorOrcamento: number | null
}

export interface SolicitacaoCompraFormValues {
	pecaId: string
	manutencaoId: string
	quantidadeNecessaria: number | ''
	fornecedor: string
	valorOrcamento: number | ''
}
