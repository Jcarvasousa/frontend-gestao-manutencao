export type StatusMaquina = 'ATIVA' | 'PARADA' | 'EM_MANUTENCAO' | 'INATIVA'

export interface Maquina {
	id: number
	codigo: string
	descricao: string
	setor: string | null
	status: StatusMaquina
	criadaEm: string
	atualizadaEm: string
}

export interface MaquinaPayload {
	codigo: string
	descricao: string
	setor: string | null
}

export interface MaquinaFormValues {
	codigo: string
	descricao: string
	setor: string
}
