import { apiClient } from '@/api/client'
import type {
  RelatorioCustoMaquina,
  RelatorioCustoMensal,
  RelatorioGastoRealizado,
  RelatorioOrcamentoAnual,
  RelatorioOrcamentoMensal,
} from '@/types/Relatorio'

export async function buscarCustoMensal(mes: number, ano: number): Promise<RelatorioCustoMensal> {
  const { data } = await apiClient.get<RelatorioCustoMensal>('/relatorios/custo-mensal', { params: { mes, ano } })
  return data
}

export async function buscarCustoMaquinaMensal(maquinaId: number, mes: number, ano: number): Promise<RelatorioCustoMaquina> {
  const { data } = await apiClient.get<RelatorioCustoMaquina>('/relatorios/custo-maquina/mensal', {
    params: { maquinaId, mes, ano },
  })
  return data
}

export async function buscarCustoMaquinaAnual(maquinaId: number, ano: number): Promise<RelatorioCustoMaquina> {
  const { data } = await apiClient.get<RelatorioCustoMaquina>('/relatorios/custo-maquina/anual', {
    params: { maquinaId, ano },
  })
  return data
}

export async function buscarCustoMaquinaTotal(maquinaId: number): Promise<RelatorioCustoMaquina> {
  const { data } = await apiClient.get<RelatorioCustoMaquina>('/relatorios/custo-maquina/total', {
    params: { maquinaId },
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

export async function baixarPdf(url: string, params: Record<string, string | number>, nomeArquivo: string) {
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

export async function baixarCustoMaquinaMensalPdf(maquinaId: number, mes: number, ano: number) {
  await baixarPdf(
    '/relatorios/custo-maquina/mensal/pdf',
    { maquinaId, mes, ano },
    `relatorio-custo-maquina-mensal-${maquinaId}-${mes}-${ano}.pdf`,
  )
}

export async function baixarCustoMaquinaAnualPdf(maquinaId: number, ano: number) {
  await baixarPdf(
    '/relatorios/custo-maquina/anual/pdf',
    { maquinaId, ano },
    `relatorio-custo-maquina-anual-${maquinaId}-${ano}.pdf`,
  )
}

export async function baixarCustoMaquinaTotalPdf(maquinaId: number) {
  await baixarPdf(
    '/relatorios/custo-maquina/total/pdf',
    { maquinaId },
    `relatorio-custo-maquina-total-${maquinaId}.pdf`,
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
