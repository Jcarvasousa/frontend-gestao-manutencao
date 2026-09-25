import { useQuery } from '@tanstack/react-query'
import { baixarGastoRealizadoPdf, buscarGastoRealizado } from '@/api/relatorios'
import { Button } from '@/components/ui/button'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

interface RelatorioGastoRealizadoCardProps {
  mes: number
  ano: number
}

export function RelatorioGastoRealizadoCard({ mes, ano }: RelatorioGastoRealizadoCardProps) {
  const query = useQuery({
    queryKey: ['relatorio-gasto-realizado', mes, ano],
    queryFn: () => buscarGastoRealizado(mes, ano),
  })

  return (
    <div className="rounded-lg border p-6">
      {query.isPending ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : query.isError ? (
        <p className="text-sm text-destructive">Não foi possível carregar o relatório.</p>
      ) : (
        <>
          <dl>
            <div>
              <dt className="text-sm text-slate-500">Valor Gasto</dt>
              <dd className="text-lg font-semibold">{currencyFormatter.format(query.data.valorGasto)}</dd>
            </div>
          </dl>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => baixarGastoRealizadoPdf(mes, ano)}>
              Baixar PDF
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
