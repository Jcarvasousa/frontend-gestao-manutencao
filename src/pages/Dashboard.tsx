import { useQuery } from '@tanstack/react-query'
import { buscarPendentes } from '@/api/solicitacoesCompra'
import { ReceberButton } from '@/pages/Compras'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { SolicitacaoCompra, StatusSolicitacaoCompra } from '@/types/SolicitacaoCompra'

const STATUS_LABELS: Record<StatusSolicitacaoCompra, string> = {
  AGUARDANDO_ORCAMENTO: 'Aguardando orçamento',
  APROVADA: 'Aprovada',
  PEDIDO_REALIZADO: 'Pedido realizado',
  RECEBIDA: 'Recebida',
  CANCELADA: 'Cancelada',
}

function formatarData(valor: string): string {
  return new Date(valor).toLocaleDateString('pt-BR')
}

function calcularDiasEmAberto(dataSolicitacao: string): number {
  const inicio = new Date(dataSolicitacao)
  const hoje = new Date()
  const diffMs = hoje.setHours(0, 0, 0, 0) - inicio.setHours(0, 0, 0, 0)
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

function DiasEmAbertoBadge({ dias }: { dias: number }) {
  if (dias > 7) {
    return <Badge variant="destructive">{dias} dias</Badge>
  }

  if (dias >= 3) {
    return (
      <Badge
        variant="outline"
        className="border-yellow-300 bg-yellow-100 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
      >
        {dias} dias
      </Badge>
    )
  }

  return <Badge variant="secondary">{dias} dias</Badge>
}

export function Dashboard() {
  const query = useQuery({
    queryKey: ['solicitacoes-pendentes'],
    queryFn: buscarPendentes,
  })

  const solicitacoes = query.data ?? []

  const ordenadas = [...solicitacoes].sort(
    (a, b) => new Date(a.dataSolicitacao).getTime() - new Date(b.dataSolicitacao).getTime(),
  )

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-sm font-medium text-slate-500">Módulo</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">Dashboard</h2>

      <div className="mt-8 overflow-hidden rounded-lg border">
        {query.isPending ? (
          <p className="p-6 text-sm text-slate-500">Carregando...</p>
        ) : query.isError ? (
          <p className="p-6 text-sm text-destructive">Não foi possível carregar as solicitações pendentes.</p>
        ) : ordenadas.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Nenhuma solicitação pendente</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Peça</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Solicitado em</TableHead>
                <TableHead>Dias em aberto</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordenadas.map((solicitacao: SolicitacaoCompra) => {
                const finalizada = solicitacao.status === 'RECEBIDA' || solicitacao.status === 'CANCELADA'
                const dias = calcularDiasEmAberto(solicitacao.dataSolicitacao)

                return (
                  <TableRow key={solicitacao.id}>
                    <TableCell className="font-medium">
                      {solicitacao.pecaCodigo} - {solicitacao.pecaNome}
                    </TableCell>
                    <TableCell>{STATUS_LABELS[solicitacao.status]}</TableCell>
                    <TableCell>{formatarData(solicitacao.dataSolicitacao)}</TableCell>
                    <TableCell>
                      <DiasEmAbertoBadge dias={dias} />
                    </TableCell>
                    <TableCell>
                      {finalizada ? (
                        <span className="text-sm text-slate-500">Finalizada</span>
                      ) : (
                        <ReceberButton solicitacao={solicitacao} />
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </section>
  )
}
