export type TipoMovimentacao = 'ENTRADA' | 'SAIDA' | 'AJUSTE'

export const TIPO_MOVIMENTACAO_INFO: Record<
	TipoMovimentacao,
	{ label: string; badgeVariant: 'default' | 'destructive' | 'secondary' }
> = {
	ENTRADA: { label: 'Entrada', badgeVariant: 'default' },
	SAIDA: { label: 'Saída', badgeVariant: 'destructive' },
	AJUSTE: { label: 'Ajuste', badgeVariant: 'secondary' },
}

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

export interface MovimentacaoAjustePayload {
	pecaId: number
	quantidadeNova: number
	observacao: string
}
