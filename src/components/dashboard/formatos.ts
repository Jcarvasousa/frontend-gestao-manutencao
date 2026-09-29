import { nomeMes } from '@/lib/meses'

const numero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })
const moedaInteira = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

export const ABREVIACOES_MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const

export function formatarNumero(valor: number): string {
  return numero.format(valor)
}

export function formatarMoedaInteira(valor: number): string {
  return moedaInteira.format(valor)
}

export function formatarPercentual(valor: number, casas: number): string {
  return `${valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`
}

export function mesPorExtenso(mes: number): string {
  return nomeMes(mes).toLocaleLowerCase('pt-BR')
}

export interface MesReferencia {
  mes: number
  ano: number
  indice: number // 1 = mais antigo ... 12 = mês atual
}

// 12 meses terminando no mês informado (inclusive), do mais antigo ao mais recente.
export function janelaDe12Meses(mes: number, ano: number): MesReferencia[] {
  const resultado: MesReferencia[] = []
  for (let i = 11; i >= 0; i--) {
    const total = ano * 12 + (mes - 1) - i
    resultado.push({ ano: Math.floor(total / 12), mes: (total % 12) + 1, indice: 12 - i })
  }
  return resultado
}

// "out ’25" na primeira barra e em janeiro; "nov", "dez"... nas demais.
export function rotuloEixo(ref: MesReferencia): string {
  const abrev = ABREVIACOES_MES[ref.mes - 1]
  if (ref.indice === 1 || ref.mes === 1) return `${abrev} ’${String(ref.ano).slice(-2)}`
  return abrev
}

export function rotuloCurto(ref: MesReferencia): string {
  return `${ABREVIACOES_MES[ref.mes - 1]}/${ref.ano}`
}
