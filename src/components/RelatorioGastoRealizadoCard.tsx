import { useQuery } from '@tanstack/react-query'
import { baixarGastoRealizadoPdf, buscarGastoRealizado } from '@/api/relatorios'
import { Button } from '@/components/ui/button'
import { nomeMes } from '@/lib/meses'

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
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : query.isError ? (
        <p className="text-sm text-destructive">Não foi possível carregar o relatório.</p>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">Valor Gasto ({nomeMes(mes)}/{ano})</p>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-muted-foreground">Peças</dt>
              <dd className="text-lg">{currencyFormatter.format(query.data.valorGastoPecas)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Serviço de terceiros</dt>
              <dd className="text-lg">{currencyFormatter.format(query.data.valorGastoServicoTerceiro)}</dd>
            </div>
            <div className="border-t pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
              <dt className="text-sm text-muted-foreground">Total</dt>
              <dd className="text-lg font-semibold">{currencyFormatter.format(query.data.valorGastoTotal)}</dd>
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
