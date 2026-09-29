import { useQuery } from '@tanstack/react-query'
import { buscarPendentes } from '@/api/solicitacoesCompra'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ReceberButton } from '@/pages/Compras'
import type { StatusSolicitacaoCompra } from '@/types/SolicitacaoCompra'
import { CardShell, Esqueleto, EstadoCarregando, EstadoErro } from '@/components/dashboard/ui'

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
      <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning">
        {dias} dias
      </Badge>
    )
  }

  return <Badge variant="secondary">{dias} dias</Badge>
}

export function ComprasPendentesCard() {
  const query = useQuery({
    queryKey: ['solicitacoes-pendentes'],
    queryFn: buscarPendentes,
  })

  const ordenadas = [...(query.data ?? [])].sort(
    (a, b) => new Date(a.dataSolicitacao).getTime() - new Date(b.dataSolicitacao).getTime(),
  )

  return (
    <CardShell titulo="Compras pendentes" linkTexto="Ver compras" linkPara="/compras" className="md:col-span-2 lg:col-span-12">
      {query.isPending ? (
        <EstadoCarregando rotulo="Carregando compras pendentes">
          <div className="space-y-3">
            <Esqueleto className="h-9 w-full" />
            <Esqueleto className="h-9 w-full" />
            <Esqueleto className="h-9 w-full" />
          </div>
        </EstadoCarregando>
      ) : query.isError ? (
        <EstadoErro
          erro={query.error}
          fallback="Não foi possível carregar as solicitações pendentes."
          aoTentarNovamente={() => void query.refetch()}
        />
      ) : ordenadas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente</p>
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {ordenadas.map((solicitacao) => {
              const finalizada = solicitacao.status === 'RECEBIDA' || solicitacao.status === 'CANCELADA'
              const dias = calcularDiasEmAberto(solicitacao.dataSolicitacao)

              return (
                <li key={solicitacao.id} className="rounded-lg border border-border bg-surface/40 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium text-foreground">
                        {solicitacao.pecaCodigo} - {solicitacao.pecaNome}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {STATUS_LABELS[solicitacao.status]} · {formatarData(solicitacao.dataSolicitacao)}
                      </p>
                    </div>
                    <span className="shrink-0">
                      <DiasEmAbertoBadge dias={dias} />
                    </span>
                  </div>
                  <div className="mt-3">
                    {finalizada ? (
                      <span className="text-sm text-muted-foreground">Finalizada</span>
                    ) : (
                      <ReceberButton solicitacao={solicitacao} className="w-full" />
                    )}
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="-mx-2 hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Peça</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Solicitado em</TableHead>
                  <TableHead className="text-muted-foreground">Dias em aberto</TableHead>
                  <TableHead className="text-muted-foreground">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordenadas.map((solicitacao) => {
                  const finalizada = solicitacao.status === 'RECEBIDA' || solicitacao.status === 'CANCELADA'
                  const dias = calcularDiasEmAberto(solicitacao.dataSolicitacao)

                  return (
                    <TableRow key={solicitacao.id}>
                      <TableCell className="whitespace-normal font-medium">
                        {solicitacao.pecaCodigo} - {solicitacao.pecaNome}
                      </TableCell>
                      <TableCell>{STATUS_LABELS[solicitacao.status]}</TableCell>
                      <TableCell>{formatarData(solicitacao.dataSolicitacao)}</TableCell>
                      <TableCell>
                        <DiasEmAbertoBadge dias={dias} />
                      </TableCell>
                      <TableCell>
                        {finalizada ? (
                          <span className="text-sm text-muted-foreground">Finalizada</span>
                        ) : (
                          <ReceberButton solicitacao={solicitacao} />
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </CardShell>
  )
}
