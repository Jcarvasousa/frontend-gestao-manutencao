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
	custoMaoDeObra: number | null
	status: StatusManutencao
	tecnicoResponsavel: string | null
	dataAbertura: string
	dataInicio: string | null
	dataConclusao: string | null
}

export interface ManutencaoPayload {
	maquinaId: number
	problemaDescricao: string
	tipo: TipoManutencao
	tecnicoResponsavel: string | null
}

export interface ManutencaoFormValues {
	maquinaId: string
	problemaDescricao: string
	tipo: TipoManutencao
	tecnicoResponsavel: string
}

export interface ManutencaoConcluirPayload {
	descricaoServico: string | null
	custoMaoDeObra: number | null
}
