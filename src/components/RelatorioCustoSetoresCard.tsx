import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { baixarCustoSetoresPdf, buscarCustoSetores } from '@/api/relatorios'
import { PeriodoRelatorioSelector } from '@/components/PeriodoRelatorioSelector'
import { SetorCheckList } from '@/components/SetorCheckList'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { mensagemDeErro } from '@/lib/erros'
import { currencyFormatter } from '@/lib/formatadores'
import { resolverPeriodo, type ModoPeriodo } from '@/lib/periodoRelatorio'

const percentualFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function RelatorioCustoSetoresCard() {
  const dataAtual = new Date()
  const [setorIds, setSetorIds] = useState<number[]>([])
  const [modo, setModo] = useState<ModoPeriodo>('mensal')
  const [mes, setMes] = useState<number | ''>(dataAtual.getMonth() + 1)
  const [ano, setAno] = useState<number | ''>(dataAtual.getFullYear())
  const [baixando, setBaixando] = useState(false)
  const [erroPdf, setErroPdf] = useState<string | null>(null)

  const periodo = resolverPeriodo(modo, mes, ano)
  const ids = [...setorIds].sort((a, b) => a - b)
  const habilitado = ids.length > 0 && periodo.erro === null

  const query = useQuery({
    queryKey: ['relatorio-custo-setores', ids, periodo.mes ?? null, periodo.ano ?? null],
    queryFn: () => buscarCustoSetores({ setorIds: ids, mes: periodo.mes, ano: periodo.ano }),
    enabled: habilitado,
  })

  async function baixarPdf() {
    setBaixando(true)
    setErroPdf(null)
    try {
      await baixarCustoSetoresPdf({ setorIds: ids, mes: periodo.mes, ano: periodo.ano })
    } catch (error) {
      setErroPdf(mensagemDeErro(error, 'Não foi possível baixar o PDF.'))
    } finally {
      setBaixando(false)
    }
  }

  const linhas = query.data?.setores ?? []
  const totalMaquinas = linhas.reduce((soma, linha) => soma + linha.quantidadeMaquinas, 0)
  const totalPecas = linhas.reduce((soma, linha) => soma + linha.custoPecas, 0)
  const totalMaoDeObra = linhas.reduce((soma, linha) => soma + linha.custoMaoDeObra, 0)

  return (
    <div className="rounded-lg border p-6">
      <div className="flex flex-col gap-4">
        <SetorCheckList value={setorIds} onChange={setSetorIds} />
        <PeriodoRelatorioSelector
          idPrefix="custo-setores"
          modo={modo}
          mes={mes}
          ano={ano}
          onModoChange={setModo}
          onMesChange={setMes}
          onAnoChange={setAno}
        />
      </div>

      <div className="mt-6">
        {ids.length === 0 ? (
          <p className="text-sm text-slate-500">Marque ao menos um setor para ver o custo detalhado.</p>
        ) : periodo.erro !== null ? (
          <p className="text-sm text-destructive">{periodo.erro}</p>
        ) : query.isPending ? (
          <p className="text-sm text-slate-500">Carregando relatório por setor (pode levar alguns segundos)...</p>
        ) : query.isError ? (
          <p className="text-sm text-destructive">
            {mensagemDeErro(query.error, 'Não foi possível carregar o relatório.')}
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="min-w-0 flex-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Setor</TableHead>
                      <TableHead className="text-right">Máquinas</TableHead>
                      <TableHead className="text-right">Peças</TableHead>
                      <TableHead className="text-right">Mão de obra</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">% do total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linhas.map((linha) => (
                      <TableRow key={linha.setorId ?? 'sem-setor'}>
                        <TableCell>
                          {linha.setorNome}
                          {!linha.ativo && <span className="text-muted-foreground"> (inativo)</span>}
                        </TableCell>
                        <TableCell className="text-right">{linha.quantidadeMaquinas}</TableCell>
                        <TableCell className="text-right">{currencyFormatter.format(linha.custoPecas)}</TableCell>
                        <TableCell className="text-right">{currencyFormatter.format(linha.custoMaoDeObra)}</TableCell>
                        <TableCell className="text-right">{currencyFormatter.format(linha.custoTotal)}</TableCell>
                        <TableCell className="text-right">{percentualFormatter.format(linha.percentualDoTotal)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-semibold">Total geral</TableCell>
                      <TableCell className="text-right font-semibold">{totalMaquinas}</TableCell>
                      <TableCell className="text-right font-semibold">{currencyFormatter.format(totalPecas)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {currencyFormatter.format(totalMaoDeObra)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {currencyFormatter.format(query.data.totalGeral)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
              {/* Espaço reservado para o gráfico de rosca (lote de design). */}
              <div data-slot="grafico-rosca" className="w-full shrink-0 lg:w-72" />
            </div>
            <div className="mt-4 flex items-center justify-end gap-3">
              {erroPdf && <p className="text-sm text-destructive">{erroPdf}</p>}
              <Button variant="outline" size="sm" disabled={baixando} onClick={baixarPdf}>
                {baixando ? 'Baixando...' : 'Baixar PDF'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
