import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { buscarOrcamentosPorAno } from '@/api/orcamentosMensais'
import { Button } from '@/components/ui/button'
import { OrcamentoMensalFormDialog } from '@/components/OrcamentoMensalFormDialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { NOMES_MESES } from '@/lib/meses'
import type { OrcamentoMensal } from '@/types/OrcamentoMensal'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function OrcamentosMensais() {
  const anoAtual = new Date().getFullYear()
  const [ano, setAno] = useState(anoAtual)
  const [mesSelecionado, setMesSelecionado] = useState<number | null>(null)

  const query = useQuery({
    queryKey: ['orcamentos-mensais', ano],
    queryFn: () => buscarOrcamentosPorAno(ano),
  })

  const orcamentos = query.data ?? []
  const orcamentoPorMes = new Map<number, OrcamentoMensal>(orcamentos.map((orcamento) => [orcamento.mes, orcamento]))
  const totalAnual = orcamentos.reduce((total, orcamento) => total + orcamento.valorPlanejado, 0)
  const orcamentoSelecionado = mesSelecionado !== null ? orcamentoPorMes.get(mesSelecionado) ?? null : null

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-sm font-medium text-slate-500">Módulo</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">Orçamento Mensal</h2>

      <div className="mt-6 flex items-center gap-3">
        <Button variant="outline" onClick={() => setAno((anoCorrente) => anoCorrente - 1)}>
          Ano anterior
        </Button>
        <span className="min-w-16 text-center text-lg font-semibold">{ano}</span>
        <Button variant="outline" onClick={() => setAno((anoCorrente) => anoCorrente + 1)}>
          Próximo ano
        </Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border">
        {query.isPending ? (
          <p className="p-6 text-sm text-slate-500">Carregando...</p>
        ) : query.isError ? (
          <p className="p-6 text-sm text-destructive">Não foi possível carregar os orçamentos.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead>Valor planejado</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {NOMES_MESES.map((nome, index) => {
                const mes = index + 1
                const orcamento = orcamentoPorMes.get(mes)

                return (
                  <TableRow key={mes}>
                    <TableCell className="font-medium">{nome}</TableCell>
                    <TableCell>
                      {orcamento ? currencyFormatter.format(orcamento.valorPlanejado) : 'Não cadastrado'}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => setMesSelecionado(mes)}>
                        {orcamento ? 'Editar' : 'Cadastrar'}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {!query.isPending && !query.isError && (
        <div className="mt-4 flex justify-end text-sm font-medium">
          <p>Total anual: {currencyFormatter.format(totalAnual)}</p>
        </div>
      )}

      {mesSelecionado !== null && (
        <OrcamentoMensalFormDialog
          open={mesSelecionado !== null}
          onOpenChange={(open) => {
            if (!open) setMesSelecionado(null)
          }}
          mes={mesSelecionado}
          ano={ano}
          orcamentoExistente={orcamentoSelecionado}
        />
      )}
    </section>
  )
}
