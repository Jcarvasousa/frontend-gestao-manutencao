export interface Setor {
	id: number
	nome: string
	ativo: boolean
}

export interface SetorPayload {
	nome: string
	ativo: boolean
}

export interface SetorFormValues {
	nome: string
	ativo: boolean
}
