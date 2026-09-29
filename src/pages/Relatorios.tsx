import { useState } from 'react'
import { RelatorioCustoMensalCard } from '@/components/RelatorioCustoMensalCard'
import { RelatorioCustoMaquinasCard } from '@/components/RelatorioCustoMaquinasCard'
import { RelatorioCustoSetoresCard } from '@/components/RelatorioCustoSetoresCard'
import { RelatorioOrcamentoMensalCard } from '@/components/RelatorioOrcamentoMensalCard'
import { RelatorioOrcamentoAnualCard } from '@/components/RelatorioOrcamentoAnualCard'
import { RelatorioGastoRealizadoCard } from '@/components/RelatorioGastoRealizadoCard'
import { NOMES_MESES } from '@/lib/meses'

export function Relatorios() {
  const dataAtual = new Date()
  const [mes, setMes] = useState(dataAtual.getMonth() + 1)
  const [ano, setAno] = useState(dataAtual.getFullYear())

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-sm font-medium text-muted-foreground">Módulo</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">Relatórios</h2>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium" htmlFor="filtro-mes">
            Mês
          </label>
          <select
            id="filtro-mes"
            value={mes}
            onChange={(event) => setMes(Number(event.target.value))}
            className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
          >
            {NOMES_MESES.map((nome, index) => (
              <option key={nome} value={index + 1}>
                {nome}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium" htmlFor="filtro-ano">
            Ano
          </label>
          <select
            id="filtro-ano"
            value={ano}
            onChange={(event) => setAno(Number(event.target.value))}
            className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
          >
            {Array.from({ length: 6 }, (_, index) => dataAtual.getFullYear() - 3 + index).map((anoOpcao) => (
              <option key={anoOpcao} value={anoOpcao}>
                {anoOpcao}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-xl font-semibold tracking-tight">Custo Mensal Geral</h3>
        <div className="mt-4">
          <RelatorioCustoMensalCard mes={mes} ano={ano} />
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-xl font-semibold tracking-tight">Custo por Máquinas</h3>
        <div className="mt-4">
          <RelatorioCustoMaquinasCard />
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-xl font-semibold tracking-tight">Custo por Setor</h3>
        <div className="mt-4">
          <RelatorioCustoSetoresCard />
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-xl font-semibold tracking-tight">Relatórios de Orçamento</h3>
        <div className="mt-4 flex flex-col gap-4">
          <RelatorioOrcamentoMensalCard mes={mes} ano={ano} />
          <RelatorioOrcamentoAnualCard ano={ano} />
          <RelatorioGastoRealizadoCard mes={mes} ano={ano} />
        </div>
      </div>
    </section>
  )
}
