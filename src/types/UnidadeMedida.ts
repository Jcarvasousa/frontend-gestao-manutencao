export type UnidadeMedida =
	| 'UN'
	| 'G'
	| 'KG'
	| 'T'
	| 'ML'
	| 'L'
	| 'M3'
	| 'MM'
	| 'CM'
	| 'M'
	| 'M2'
	| 'CAIXA'
	| 'SACO'
	| 'PACOTE'

export const UNIDADE_MEDIDA_LABELS: Record<UnidadeMedida, string> = {
	UN: 'Un',
	G: 'g',
	KG: 'Kg',
	T: 'T',
	ML: 'mL',
	L: 'L',
	M3: 'm³',
	MM: 'mm',
	CM: 'cm',
	M: 'm',
	M2: 'm²',
	CAIXA: 'Caixa',
	SACO: 'Saco',
	PACOTE: 'Pacote',
}

export const UNIDADE_MEDIDA_OPTIONS: { value: UnidadeMedida; label: string }[] = (
	['UN', 'G', 'KG', 'T', 'ML', 'L', 'M3', 'MM', 'CM', 'M', 'M2', 'CAIXA', 'SACO', 'PACOTE'] as const
).map((value) => ({ value, label: UNIDADE_MEDIDA_LABELS[value] }))
