import { useQuery } from '@tanstack/react-query'
import { baixarCustoMensalPdf, buscarCustoMensal } from '@/api/relatorios'
import { Button } from '@/components/ui/button'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

interface RelatorioCustoMensalCardProps {
  mes: number
  ano: number
}

export function RelatorioCustoMensalCard({ mes, ano }: RelatorioCustoMensalCardProps) {
  const query = useQuery({
    queryKey: ['relatorio-custo-mensal', mes, ano],
    queryFn: () => buscarCustoMensal(mes, ano),
  })

  return (
    <div className="rounded-lg border p-6">
      {query.isPending ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : query.isError ? (
        <p className="text-sm text-destructive">Não foi possível carregar o relatório.</p>
      ) : (
        <>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-slate-500">Custo de Peças</dt>
              <dd className="text-lg font-semibold">{currencyFormatter.format(query.data.custoPecas)}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Custo de Mão de Obra</dt>
              <dd className="text-lg font-semibold">{currencyFormatter.format(query.data.custoMaoDeObra)}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Custo Total</dt>
              <dd className="text-lg font-semibold">{currencyFormatter.format(query.data.custoTotal)}</dd>
            </div>
          </dl>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => baixarCustoMensalPdf(mes, ano)}>
              Baixar PDF
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
