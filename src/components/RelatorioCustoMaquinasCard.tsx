import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { baixarCustoMaquinasPdf, buscarCustoMaquinas } from '@/api/relatorios'
import { MaquinaMultiSelect } from '@/components/MaquinaMultiSelect'
import { PeriodoRelatorioSelector } from '@/components/PeriodoRelatorioSelector'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { mensagemDeErro } from '@/lib/erros'
import { currencyFormatter } from '@/lib/formatadores'
import { resolverPeriodo, type ModoPeriodo } from '@/lib/periodoRelatorio'
import type { Maquina } from '@/types/Maquina'

export function RelatorioCustoMaquinasCard() {
  const dataAtual = new Date()
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [modo, setModo] = useState<ModoPeriodo>('mensal')
  const [mes, setMes] = useState<number | ''>(dataAtual.getMonth() + 1)
  const [ano, setAno] = useState<number | ''>(dataAtual.getFullYear())
  const [baixando, setBaixando] = useState(false)
  const [erroPdf, setErroPdf] = useState<string | null>(null)

  const periodo = resolverPeriodo(modo, mes, ano)
  const ids = maquinas.map((maquina) => maquina.id).sort((a, b) => a - b)
  const habilitado = ids.length > 0 && periodo.erro === null

  const query = useQuery({
    queryKey: ['relatorio-custo-maquinas', ids, periodo.mes ?? null, periodo.ano ?? null],
    queryFn: () => buscarCustoMaquinas({ maquinaIds: ids, mes: periodo.mes, ano: periodo.ano }),
    enabled: habilitado,
  })

  async function baixarPdf() {
    setBaixando(true)
    setErroPdf(null)
    try {
      await baixarCustoMaquinasPdf({ maquinaIds: ids, mes: periodo.mes, ano: periodo.ano })
    } catch (error) {
      setErroPdf(mensagemDeErro(error, 'Não foi possível baixar o PDF.'))
    } finally {
      setBaixando(false)
    }
  }

  const maquinaPorId = new Map(maquinas.map((maquina) => [maquina.id, maquina]))
  const linhas = query.data?.maquinas ?? []
  const totalPecas = linhas.reduce((soma, linha) => soma + linha.custoPecas, 0)
  const totalMaoDeObra = linhas.reduce((soma, linha) => soma + linha.custoMaoDeObra, 0)

  return (
    <div className="rounded-lg border p-6">
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="custo-maquinas-busca">
            Máquinas
          </label>
          <MaquinaMultiSelect id="custo-maquinas-busca" value={maquinas} onChange={setMaquinas} />
        </div>
        <PeriodoRelatorioSelector
          idPrefix="custo-maquinas"
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
          <p className="text-sm text-muted-foreground">Selecione ao menos uma máquina para ver o custo detalhado.</p>
        ) : periodo.erro !== null ? (
          <p className="text-sm text-destructive">{periodo.erro}</p>
        ) : query.isPending ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : query.isError ? (
          <p className="text-sm text-destructive">
            {mensagemDeErro(query.error, 'Não foi possível carregar o relatório.')}
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead className="text-right">Peças</TableHead>
                  <TableHead className="text-right">Mão de obra</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.map((linha) => {
                  const maquina = maquinaPorId.get(linha.maquinaId)
                  return (
                    <TableRow key={linha.maquinaId}>
                      <TableCell>{linha.maquinaCodigo}</TableCell>
                      <TableCell>{maquina?.descricao ?? '-'}</TableCell>
                      <TableCell>{maquina ? (maquina.setorNome ?? 'Sem setor') : '-'}</TableCell>
                      <TableCell className="text-right">{currencyFormatter.format(linha.custoPecas)}</TableCell>
                      <TableCell className="text-right">{currencyFormatter.format(linha.custoMaoDeObra)}</TableCell>
                      <TableCell className="text-right">{currencyFormatter.format(linha.custoTotal)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="font-semibold">
                    Total geral
                  </TableCell>
                  <TableCell className="text-right font-semibold">{currencyFormatter.format(totalPecas)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {currencyFormatter.format(totalMaoDeObra)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {currencyFormatter.format(query.data.totalGeral)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
            <p className="mt-2 text-xs text-muted-foreground">Mão de obra = técnicos + terceiros</p>
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
