import type { UnidadeMedida } from '@/types/UnidadeMedida'

export type TipoManutencao = 'PREVENTIVA' | 'CORRETIVA'

export type StatusManutencao =
	| 'ABERTA'
	| 'EM_ANDAMENTO'
	| 'AGUARDANDO_PECA'
	| 'CONCLUIDA'
	| 'CANCELADA'

export interface Manutencao {
	id: number
	maquinaId: number
	maquinaCodigo: string
	problemaDescricao: string
	tipo: TipoManutencao
	descricaoServico: string | null
	status: StatusManutencao
	maquinaLiberadaParaUso: boolean | null
	condicoesSeguranca: string | null
	dataAbertura: string
	dataInicio: string | null
	dataConclusao: string | null
}

export interface ManutencaoPayload {
	maquinaId: number
	problemaDescricao: string
	tipo: TipoManutencao
}

export interface ManutencaoFormValues {
	maquinaId: string
	problemaDescricao: string
	tipo: TipoManutencao
}

export interface ManutencaoConcluirPayload {
	descricaoServico: string
	maquinaLiberadaParaUso: boolean
	condicoesSeguranca: string
}

export interface PecaUsada {
	pecaId: number
	pecaCodigo: string
	pecaNome: string
	unidadeMedida: UnidadeMedida
	quantidadeUsada: number
	custoTotal: number
	saldoDevolvivel: number
}

export interface ManutencaoTecnico {
	id: number
	manutencaoId: number
	tecnicoId: number
	tecnicoNome: string
	horasTrabalhadas: number
	custoPorHora: number
	custoTotal: number
}

export interface ManutencaoTecnicoPayload {
	tecnicoId: number
	horasTrabalhadas: number
}

export interface ServicoTerceiro {
	id: number
	manutencaoId: number
	valorApurado: number | null
	horasTrabalhadas: number | null
	valorHora: number | null
	valorFinal: number | null
	descricao: string
	fornecedor: string | null
	observacao: string | null
}

export interface ServicoTerceiroPayload {
	manutencaoId: number
	descricao: string
	fornecedor: string | null
	valorApurado?: number
	horasTrabalhadas?: number
	valorHora?: number
}

export interface ServicoTerceiroAtualizacaoPayload {
	valorFinal: number | null
	observacao: string | null
}

export const STATUS_MANUTENCAO_LABELS: Record<StatusManutencao, string> = {
	ABERTA: 'Aberta',
	EM_ANDAMENTO: 'Em andamento',
	AGUARDANDO_PECA: 'Aguardando peça',
	CONCLUIDA: 'Concluída',
	CANCELADA: 'Cancelada',
}

export function manutencaoAceitaAlteracoes(status: StatusManutencao): boolean {
	return status === 'ABERTA' || status === 'EM_ANDAMENTO' || status === 'AGUARDANDO_PECA'
}
