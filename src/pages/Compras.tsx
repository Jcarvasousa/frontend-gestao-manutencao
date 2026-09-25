import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buscarPecas } from '@/api/pecas'
import { buscarSolicitacoes, marcarComoRecebida } from '@/api/solicitacoesCompra'
import { Button } from '@/components/ui/button'
import { SolicitacaoCompraFormDialog } from '@/components/SolicitacaoCompraFormDialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { SolicitacaoCompra, StatusSolicitacaoCompra } from '@/types/SolicitacaoCompra'

const PAGE_SIZE = 10

const STATUS_OPTIONS: { value: StatusSolicitacaoCompra; label: string }[] = [
  { value: 'AGUARDANDO_ORCAMENTO', label: 'Aguardando orçamento' },
  { value: 'APROVADA', label: 'Aprovada' },
  { value: 'PEDIDO_REALIZADO', label: 'Pedido realizado' },
  { value: 'RECEBIDA', label: 'Recebida' },
  { value: 'CANCELADA', label: 'Cancelada' },
]

const STATUS_LABELS: Record<StatusSolicitacaoCompra, string> = Object.fromEntries(
  STATUS_OPTIONS.map((option) => [option.value, option.label]),
) as Record<StatusSolicitacaoCompra, string>

function formatarData(valor: string): string {
  return new Date(valor).toLocaleString('pt-BR')
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function ReceberButton({ solicitacao }: { solicitacao: SolicitacaoCompra }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => marcarComoRecebida(solicitacao.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacoes'] })
    },
    onError: (error) => {
      console.error('Falha ao marcar solicitação como recebida', error)
    },
  })

  return (
    <Button size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
      {mutation.isPending ? 'Salvando...' : 'Marcar como Recebida'}
    </Button>
  )
}

export function Compras() {
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState<StatusSolicitacaoCompra | ''>('')
  const [pecaId, setPecaId] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const pecasQuery = useQuery({
    queryKey: ['pecas', { page: 0, size: 100 }],
    queryFn: () => buscarPecas({ page: 0, size: 100 }),
  })

  const query = useQuery({
    queryKey: [
      'solicitacoes',
      { page, size: PAGE_SIZE, status: status || undefined, pecaId: pecaId || undefined },
    ],
    queryFn: () =>
      buscarSolicitacoes({
        page,
        size: PAGE_SIZE,
        status: status || undefined,
        pecaId: pecaId ? Number(pecaId) : undefined,
      }),
  })

  const paginaAtual = (query.data?.number ?? page) + 1
  const totalPaginas = query.data?.totalPages ?? 0
  const solicitacoes = query.data?.content ?? []
  const pecas = pecasQuery.data?.content ?? []

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-sm font-medium text-slate-500">Módulo</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">Compras</h2>

      <div className="mt-6 flex justify-end">
        <Button onClick={() => setIsCreateDialogOpen(true)}>Nova Solicitação</Button>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium" htmlFor="filtro-status">
            Status
          </label>
          <select
            id="filtro-status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as StatusSolicitacaoCompra | '')
              setPage(0)
            }}
            className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
          >
            <option value="">Todos</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium" htmlFor="filtro-peca">
            Peça
          </label>
          <select
            id="filtro-peca"
            value={pecaId}
            onChange={(event) => {
              setPecaId(event.target.value)
              setPage(0)
            }}
            className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
          >
            <option value="">Todas</option>
            {pecas.map((peca) => (
              <option key={peca.id} value={peca.id}>
                {peca.codigo} - {peca.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border">
        {query.isPending ? (
          <p className="p-6 text-sm text-slate-500">Carregando...</p>
        ) : query.isError ? (
          <p className="p-6 text-sm text-destructive">Não foi possível carregar as solicitações.</p>
        ) : solicitacoes.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Nenhuma solicitação encontrada</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Peça</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Valor Orçamento</TableHead>
                <TableHead>Data Solicitação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {solicitacoes.map((solicitacao) => {
                const finalizada = solicitacao.status === 'RECEBIDA' || solicitacao.status === 'CANCELADA'

                return (
                  <TableRow key={solicitacao.id}>
                    <TableCell className="font-medium">
                      {solicitacao.pecaCodigo} - {solicitacao.pecaNome}
                    </TableCell>
                    <TableCell>{solicitacao.quantidadeNecessaria}</TableCell>
                    <TableCell>{STATUS_LABELS[solicitacao.status]}</TableCell>
                    <TableCell>{solicitacao.fornecedor ?? '—'}</TableCell>
                    <TableCell>
                      {solicitacao.valorOrcamento === null ? '—' : formatarMoeda(solicitacao.valorOrcamento)}
                    </TableCell>
                    <TableCell>{formatarData(solicitacao.dataSolicitacao)}</TableCell>
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

      {!query.isPending && !query.isError && query.data && (
        <div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-slate-500">{query.data.totalElements} registros</p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setPage((currentPage) => currentPage - 1)}
              disabled={query.data.first}
            >
              Anterior
            </Button>
            <span className="min-w-28 text-center">
              Página {paginaAtual} de {totalPaginas}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((currentPage) => currentPage + 1)}
              disabled={query.data.last}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      <SolicitacaoCompraFormDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </section>
  )
}
