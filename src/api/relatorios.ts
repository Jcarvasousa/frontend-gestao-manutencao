import { apiClient } from '@/api/client'
import type {
  RelatorioCustoMaquinas,
  RelatorioCustoMensal,
  RelatorioCustoSetores,
  RelatorioGastoRealizado,
  RelatorioKpis,
  RelatorioOrcamentoAnual,
  RelatorioOrcamentoMensal,
} from '@/types/Relatorio'

export interface CustoMaquinasFiltro {
  maquinaIds: number[]
  mes?: number
  ano?: number
}

export interface CustoSetoresFiltro {
  setorIds?: number[]
  mes?: number
  ano?: number
}

function paramsCustoMaquinas({ maquinaIds, mes, ano }: CustoMaquinasFiltro) {
  return { maquinaIds: maquinaIds.join(','), mes, ano }
}

function paramsCustoSetores({ setorIds, mes, ano }: CustoSetoresFiltro) {
  return { setorIds: setorIds && setorIds.length > 0 ? setorIds.join(',') : undefined, mes, ano }
}

function sufixoPeriodo(mes?: number, ano?: number) {
  if (mes !== undefined && ano !== undefined) return `${mes}-${ano}`
  if (ano !== undefined) return `${ano}`
  return 'total'
}

export async function buscarKpis(): Promise<RelatorioKpis> {
  const { data } = await apiClient.get<RelatorioKpis>('/relatorios/kpis')
  return data
}

export async function buscarCustoMensal(mes: number, ano: number): Promise<RelatorioCustoMensal> {
  const { data } = await apiClient.get<RelatorioCustoMensal>('/relatorios/custo-mensal', { params: { mes, ano } })
  return data
}

export async function buscarCustoMaquinas(filtro: CustoMaquinasFiltro): Promise<RelatorioCustoMaquinas> {
  const { data } = await apiClient.get<RelatorioCustoMaquinas>('/relatorios/custo-maquinas', {
    params: paramsCustoMaquinas(filtro),
  })
  return data
}

export async function buscarCustoSetores(filtro: CustoSetoresFiltro): Promise<RelatorioCustoSetores> {
  const { data } = await apiClient.get<RelatorioCustoSetores>('/relatorios/custo-setores', {
    params: paramsCustoSetores(filtro),
  })
  return data
}

export async function buscarOrcamentoMensal(mes: number, ano: number): Promise<RelatorioOrcamentoMensal> {
  const { data } = await apiClient.get<RelatorioOrcamentoMensal>('/relatorios/orcamento-mensal', {
    params: { mes, ano },
  })
  return data
}

export async function buscarOrcamentoAnual(ano: number): Promise<RelatorioOrcamentoAnual> {
  const { data } = await apiClient.get<RelatorioOrcamentoAnual>('/relatorios/orcamento-anual', {
    params: { ano },
  })
  return data
}

export async function buscarGastoRealizado(mes: number, ano: number): Promise<RelatorioGastoRealizado> {
  const { data } = await apiClient.get<RelatorioGastoRealizado>('/relatorios/gasto-realizado', {
    params: { mes, ano },
  })
  return data
}

export async function baixarPdf(url: string, params: Record<string, string | number | undefined>, nomeArquivo: string) {
  const response = await apiClient.get(url, { params, responseType: 'blob' })
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(blobUrl)
}

export async function baixarCustoMensalPdf(mes: number, ano: number) {
  await baixarPdf('/relatorios/custo-mensal/pdf', { mes, ano }, `relatorio-custo-mensal-${mes}-${ano}.pdf`)
}

export async function baixarCustoMaquinasPdf(filtro: CustoMaquinasFiltro) {
  await baixarPdf(
    '/relatorios/custo-maquinas/pdf',
    paramsCustoMaquinas(filtro),
    `relatorio-custo-maquinas-${sufixoPeriodo(filtro.mes, filtro.ano)}.pdf`,
  )
}

export async function baixarCustoSetoresPdf(filtro: CustoSetoresFiltro) {
  await baixarPdf(
    '/relatorios/custo-setores/pdf',
    paramsCustoSetores(filtro),
    `relatorio-custo-setores-${sufixoPeriodo(filtro.mes, filtro.ano)}.pdf`,
  )
}

export async function baixarOrcamentoMensalPdf(mes: number, ano: number) {
  await baixarPdf('/relatorios/orcamento-mensal/pdf', { mes, ano }, `relatorio-orcamento-mensal-${mes}-${ano}.pdf`)
}

export async function baixarOrcamentoAnualPdf(ano: number) {
  await baixarPdf('/relatorios/orcamento-anual/pdf', { ano }, `relatorio-orcamento-anual-${ano}.pdf`)
}

export async function baixarGastoRealizadoPdf(mes: number, ano: number) {
  await baixarPdf('/relatorios/gasto-realizado/pdf', { mes, ano }, `relatorio-gasto-realizado-${mes}-${ano}.pdf`)
}
