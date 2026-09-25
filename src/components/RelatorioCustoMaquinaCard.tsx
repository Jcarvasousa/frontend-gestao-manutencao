import { useQuery } from '@tanstack/react-query'
import {
  baixarCustoMaquinaAnualPdf,
  baixarCustoMaquinaMensalPdf,
  baixarCustoMaquinaTotalPdf,
  buscarCustoMaquinaAnual,
  buscarCustoMaquinaMensal,
  buscarCustoMaquinaTotal,
} from '@/api/relatorios'
import { Button } from '@/components/ui/button'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

type ModoRelatorioCustoMaquina = 'mensal' | 'anual' | 'total'

interface RelatorioCustoMaquinaCardProps {
  maquinaId: number
  modo: ModoRelatorioCustoMaquina
  mes: number
  ano: number
}

const TITULOS: Record<ModoRelatorioCustoMaquina, string> = {
  mensal: 'Custo no Mês',
  anual: 'Custo no Ano',
  total: 'Custo Total',
}

export function RelatorioCustoMaquinaCard({ maquinaId, modo, mes, ano }: RelatorioCustoMaquinaCardProps) {
  const query = useQuery({
    queryKey: ['relatorio-custo-maquina', modo, maquinaId, mes, ano],
    queryFn: () => {
      if (modo === 'mensal') return buscarCustoMaquinaMensal(maquinaId, mes, ano)
      if (modo === 'anual') return buscarCustoMaquinaAnual(maquinaId, ano)
      return buscarCustoMaquinaTotal(maquinaId)
    },
  })

  function baixarPdf() {
    if (modo === 'mensal') return baixarCustoMaquinaMensalPdf(maquinaId, mes, ano)
    if (modo === 'anual') return baixarCustoMaquinaAnualPdf(maquinaId, ano)
    return baixarCustoMaquinaTotalPdf(maquinaId)
  }

  return (
    <div className="rounded-lg border p-6">
      <p className="text-sm font-medium text-slate-500">{TITULOS[modo]}</p>
      {query.isPending ? (
        <p className="mt-2 text-sm text-slate-500">Carregando...</p>
      ) : query.isError ? (
        <p className="mt-2 text-sm text-destructive">Não foi possível carregar o relatório.</p>
      ) : (
        <>
          <dl className="mt-2 flex flex-col gap-3">
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
            <Button variant="outline" size="sm" onClick={baixarPdf}>
              Baixar PDF
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
