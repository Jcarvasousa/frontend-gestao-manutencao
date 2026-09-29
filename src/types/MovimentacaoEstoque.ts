export type TipoMovimentacao = 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'DEVOLUCAO'

export const TIPO_MOVIMENTACAO_INFO: Record<
	TipoMovimentacao,
	{ label: string; badgeVariant: 'default' | 'destructive' | 'secondary' | 'outline' }
> = {
	ENTRADA: { label: 'Entrada', badgeVariant: 'default' },
	SAIDA: { label: 'Saída', badgeVariant: 'destructive' },
	AJUSTE: { label: 'Ajuste', badgeVariant: 'secondary' },
	DEVOLUCAO: { label: 'Devolução', badgeVariant: 'outline' },
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

export interface MovimentacaoSaidaPayload {
	pecaId: number
	manutencaoId: number
	quantidade: number
	observacao: string | null
}

export type MovimentacaoDevolucaoPayload = MovimentacaoSaidaPayload

export interface MovimentacaoAjustePayload {
	pecaId: number
	quantidadeNova: number
	observacao: string
}
