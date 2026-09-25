import { useQuery } from '@tanstack/react-query'
import { baixarOrcamentoAnualPdf, buscarOrcamentoAnual } from '@/api/relatorios'
import { Button } from '@/components/ui/button'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
})

interface RelatorioOrcamentoAnualCardProps {
  ano: number
}

export function RelatorioOrcamentoAnualCard({ ano }: RelatorioOrcamentoAnualCardProps) {
  const query = useQuery({
    queryKey: ['relatorio-orcamento-anual', ano],
    queryFn: () => buscarOrcamentoAnual(ano),
  })

  return (
    <div className="rounded-lg border p-6">
      {query.isPending ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : query.isError ? (
        <p className="text-sm text-destructive">Não foi possível carregar o relatório.</p>
      ) : (
        <>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-sm text-slate-500">Valor Planejado Total ({ano})</dt>
              <dd className="text-lg font-semibold">{currencyFormatter.format(query.data.valorPlanejadoTotal)}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Valor Realizado Total ({ano})</dt>
              <dd className="text-lg font-semibold">{currencyFormatter.format(query.data.valorRealizadoTotal)}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Saldo Disponível</dt>
              <dd className="text-lg font-semibold">{currencyFormatter.format(query.data.saldoDisponivel)}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Percentual Utilizado</dt>
              <dd className="text-lg font-semibold">{percentFormatter.format(query.data.percentualUtilizado)}%</dd>
            </div>
          </dl>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => baixarOrcamentoAnualPdf(ano)}>
              Baixar PDF
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
