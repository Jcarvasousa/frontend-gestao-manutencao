import type { UnidadeMedida } from '@/types/UnidadeMedida'

export interface Peca {
	id: number
	codigo: string
	nome: string
	categoria: string | null
	unidadeMedida: UnidadeMedida
	localizacaoFisica: string | null
	quantidadeAtual: number
	estoqueMinimo: number | null
	custoUnitario: number | null
	abaixoDoMinimo: boolean
}

export interface PecaPayload {
	codigo: string
	nome: string
	categoria: string | null
	unidadeMedida: UnidadeMedida
	localizacaoFisica: string | null
	quantidadeAtual: number
	estoqueMinimo: number | null
	custoUnitario: number | null
}

export interface PecaFormValues {
	codigo: string
	nome: string
	categoria: string
	unidadeMedida: UnidadeMedida | ''
	localizacaoFisica: string
	quantidadeAtual: number
	estoqueMinimo: number | ''
	custoUnitario: number | ''
}
