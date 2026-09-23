export interface Peca {
	id: number
	codigo: string
	nome: string
	categoria: string | null
	unidadeMedida: string
	localizacaoFisica: string | null
	quantidadeAtual: number
	estoqueMinimo: number | null
	custoUnitario: number | null
	abaixoDoMinimo: boolean
}
