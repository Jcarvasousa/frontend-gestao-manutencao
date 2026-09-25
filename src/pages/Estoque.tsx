import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { buscarMovimentacoes } from '@/api/movimentacoes'
import { buscarPecas } from '@/api/pecas'
import { buscarManutencoes } from '@/api/manutencoes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MovimentacaoEntradaDialog } from '@/components/MovimentacaoEntradaDialog'
import { MovimentacaoSaidaDialog } from '@/components/MovimentacaoSaidaDialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { TipoMovimentacao } from '@/types/MovimentacaoEstoque'

const PAGE_SIZE = 10

const TIPO_OPTIONS: { value: TipoMovimentacao; label: string }[] = [
  { value: 'ENTRADA', label: 'Entrada' },
  { value: 'SAIDA', label: 'Saída' },
]

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function formatarDataHora(valor: string): string {
  return new Date(valor).toLocaleString('pt-BR')
}

export function Estoque() {
  const [page, setPage] = useState(0)
  const [tipo, setTipo] = useState<TipoMovimentacao | ''>('')
  const [pecaId, setPecaId] = useState('')
  const [manutencaoId, setManutencaoId] = useState('')
  const [isEntradaDialogOpen, setIsEntradaDialogOpen] = useState(false)
  const [isSaidaDialogOpen, setIsSaidaDialogOpen] = useState(false)

  const pecasQuery = useQuery({
    queryKey: ['pecas', { page: 0, size: 100 }],
    queryFn: () => buscarPecas({ page: 0, size: 100 }),
  })

  const manutencoesQuery = useQuery({
    queryKey: ['manutencoes', { page: 0, size: 100 }],
    queryFn: () => buscarManutencoes({ page: 0, size: 100 }),
  })

  const query = useQuery({
    queryKey: [
      'movimentacoes',
      { page, size: PAGE_SIZE, tipo: tipo || undefined, pecaId: pecaId || undefined, manutencaoId: manutencaoId || undefined },
    ],
    queryFn: () =>
      buscarMovimentacoes({
        page,
        size: PAGE_SIZE,
        tipo: tipo || undefined,
        pecaId: pecaId ? Number(pecaId) : undefined,
        manutencaoId: manutencaoId ? Number(manutencaoId) : undefined,
      }),
  })

  const paginaAtual = (query.data?.number ?? page) + 1
  const totalPaginas = query.data?.totalPages ?? 0
  const movimentacoes = query.data?.content ?? []
  const pecas = pecasQuery.data?.content ?? []
  const manutencoes = manutencoesQuery.data?.content ?? []

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-sm font-medium text-slate-500">Módulo</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">Movimentações</h2>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={() => setIsSaidaDialogOpen(true)}>
          Registrar Saída
        </Button>
        <Button onClick={() => setIsEntradaDialogOpen(true)}>Registrar Entrada</Button>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium" htmlFor="filtro-tipo">
            Tipo
          </label>
          <select
            id="filtro-tipo"
            value={tipo}
            onChange={(event) => {
              setTipo(event.target.value as TipoMovimentacao | '')
              setPage(0)
            }}
            className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
          >
            <option value="">Todos</option>
            {TIPO_OPTIONS.map((option) => (
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
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium" htmlFor="filtro-manutencao">
            Manutenção
          </label>
          <select
            id="filtro-manutencao"
            value={manutencaoId}
            onChange={(event) => {
              setManutencaoId(event.target.value)
              setPage(0)
            }}
            className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
          >
            <option value="">Todas</option>
            {manutencoes.map((manutencao) => (
              <option key={manutencao.id} value={manutencao.id}>
                {manutencao.maquinaCodigo} - {manutencao.problemaDescricao}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border">
        {query.isPending ? (
          <p className="p-6 text-sm text-slate-500">Carregando...</p>
        ) : query.isError ? (
          <p className="p-6 text-sm text-destructive">Não foi possível carregar as movimentações.</p>
        ) : movimentacoes.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Nenhuma movimentação encontrada</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Peça</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Custo Unitário</TableHead>
                <TableHead>Observação</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Manutenção</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movimentacoes.map((movimentacao) => {
                const manutencaoRelacionada = manutencoes.find((item) => item.id === movimentacao.manutencaoId)

                return (
                  <TableRow key={movimentacao.id}>
                    <TableCell className="font-medium">{movimentacao.pecaCodigo}</TableCell>
                    <TableCell>
                      <Badge variant={movimentacao.tipo === 'ENTRADA' ? 'default' : 'destructive'}>
                        {movimentacao.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}
                      </Badge>
                    </TableCell>
                    <TableCell>{movimentacao.quantidade}</TableCell>
                    <TableCell>
                      {movimentacao.custoUnitarioMomento != null
                        ? currencyFormatter.format(movimentacao.custoUnitarioMomento)
                        : '—'}
                    </TableCell>
                    <TableCell>{movimentacao.observacao ?? '—'}</TableCell>
                    <TableCell>{formatarDataHora(movimentacao.dataHora)}</TableCell>
                    <TableCell>
                      {movimentacao.manutencaoId != null
                        ? manutencaoRelacionada
                          ? `${manutencaoRelacionada.maquinaCodigo} - ${manutencaoRelacionada.problemaDescricao}`
                          : `#${movimentacao.manutencaoId}`
                        : '—'}
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

      <MovimentacaoEntradaDialog open={isEntradaDialogOpen} onOpenChange={setIsEntradaDialogOpen} />
      <MovimentacaoSaidaDialog open={isSaidaDialogOpen} onOpenChange={setIsSaidaDialogOpen} />
    </section>
  )
}
