export interface Tecnico {
	id: number
	nome: string
	salarioMensal: number
	cargaHorariaDiaria: number
	ativo: boolean
	custoPorHora: number
}

export interface TecnicoPayload {
	nome: string
	salarioMensal: number
	cargaHorariaDiaria: number
	ativo: boolean
}

export interface TecnicoFormValues {
	nome: string
	salarioMensal: string
	cargaHorariaDiaria: string
	ativo: boolean
}
