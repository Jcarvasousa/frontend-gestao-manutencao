import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { baixarOrcamentoMensalPdf, buscarOrcamentoMensal } from '@/api/relatorios'
import { Button } from '@/components/ui/button'
import { nomeMes } from '@/lib/meses'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
})

interface RelatorioOrcamentoMensalCardProps {
  mes: number
  ano: number
}

export function RelatorioOrcamentoMensalCard({ mes, ano }: RelatorioOrcamentoMensalCardProps) {
  const query = useQuery({
    queryKey: ['relatorio-orcamento-mensal', mes, ano],
    queryFn: () => buscarOrcamentoMensal(mes, ano),
  })

  const naoEncontrado = axios.isAxiosError(query.error) && query.error.response?.status === 404

  return (
    <div className="rounded-lg border p-6">
      {query.isPending ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : query.isError ? (
        <p className="text-sm text-destructive">
          {naoEncontrado
            ? 'Nenhum orçamento cadastrado para este mês. Cadastre em Orçamentos.'
            : 'Não foi possível carregar o relatório.'}
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-sm text-slate-500">Valor Planejado ({nomeMes(mes)}/{ano})</dt>
              <dd className="text-lg font-semibold">{currencyFormatter.format(query.data.valorPlanejado)}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Valor Realizado ({nomeMes(mes)}/{ano})</dt>
              <dd className="text-lg font-semibold">{currencyFormatter.format(query.data.valorRealizado)}</dd>
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
            <Button variant="outline" size="sm" onClick={() => baixarOrcamentoMensalPdf(mes, ano)}>
              Baixar PDF
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
