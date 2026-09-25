import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buscarMaquinas } from '@/api/maquinas'
import { buscarManutencoes, iniciarManutencao } from '@/api/manutencoes'
import { Button } from '@/components/ui/button'
import { ManutencaoFormDialog } from '@/components/ManutencaoFormDialog'
import { ManutencaoConcluirDialog } from '@/components/ManutencaoConcluirDialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Manutencao, StatusManutencao, TipoManutencao } from '@/types/Manutencao'

const PAGE_SIZE = 10

const STATUS_OPTIONS: { value: StatusManutencao; label: string }[] = [
  { value: 'ABERTA', label: 'Aberta' },
  { value: 'EM_ANDAMENTO', label: 'Em andamento' },
  { value: 'AGUARDANDO_PECA', label: 'Aguardando peça' },
  { value: 'CONCLUIDA', label: 'Concluída' },
  { value: 'CANCELADA', label: 'Cancelada' },
]

const STATUS_LABELS: Record<StatusManutencao, string> = Object.fromEntries(
  STATUS_OPTIONS.map((option) => [option.value, option.label]),
) as Record<StatusManutencao, string>

const TIPO_OPTIONS: { value: TipoManutencao; label: string }[] = [
  { value: 'PREVENTIVA', label: 'Preventiva' },
  { value: 'CORRETIVA', label: 'Corretiva' },
]

const TIPO_LABELS: Record<TipoManutencao, string> = Object.fromEntries(
  TIPO_OPTIONS.map((option) => [option.value, option.label]),
) as Record<TipoManutencao, string>

function formatarDataHora(valor: string): string {
  return new Date(valor).toLocaleString('pt-BR')
}

function IniciarButton({ manutencao }: { manutencao: Manutencao }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => iniciarManutencao(manutencao.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manutencoes'] })
    },
    onError: (error) => {
      console.error('Falha ao iniciar manutenção', error)
    },
  })

  return (
    <Button size="sm" variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
      {mutation.isPending ? 'Iniciando...' : 'Iniciar'}
    </Button>
  )
}

export function Manutencoes() {
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState<StatusManutencao | ''>('')
  const [tipo, setTipo] = useState<TipoManutencao | ''>('')
  const [maquinaId, setMaquinaId] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [manutencaoAConcluir, setManutencaoAConcluir] = useState<Manutencao | null>(null)

  const maquinasQuery = useQuery({
    queryKey: ['maquinas', { page: 0, size: 100 }],
    queryFn: () => buscarMaquinas({ page: 0, size: 100 }),
  })

  const query = useQuery({
    queryKey: [
      'manutencoes',
      { page, size: PAGE_SIZE, status: status || undefined, tipo: tipo || undefined, maquinaId: maquinaId || undefined },
    ],
    queryFn: () =>
      buscarManutencoes({
        page,
        size: PAGE_SIZE,
        status: status || undefined,
        tipo: tipo || undefined,
        maquinaId: maquinaId ? Number(maquinaId) : undefined,
      }),
  })

  const paginaAtual = (query.data?.number ?? page) + 1
  const totalPaginas = query.data?.totalPages ?? 0
  const manutencoes = query.data?.content ?? []
  const maquinas = maquinasQuery.data?.content ?? []

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-sm font-medium text-slate-500">Módulo</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">Manutenções</h2>

      <div className="mt-6 flex justify-end">
        <Button onClick={() => setIsCreateDialogOpen(true)}>Nova Manutenção</Button>
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
              setStatus(event.target.value as StatusManutencao | '')
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
          <label className="mb-1.5 block text-sm font-medium" htmlFor="filtro-tipo">
            Tipo
          </label>
          <select
            id="filtro-tipo"
            value={tipo}
            onChange={(event) => {
              setTipo(event.target.value as TipoManutencao | '')
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
          <label className="mb-1.5 block text-sm font-medium" htmlFor="filtro-maquina">
            Máquina
          </label>
          <select
            id="filtro-maquina"
            value={maquinaId}
            onChange={(event) => {
              setMaquinaId(event.target.value)
              setPage(0)
            }}
            className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
          >
            <option value="">Todas</option>
            {maquinas.map((maquina) => (
              <option key={maquina.id} value={maquina.id}>
                {maquina.codigo} - {maquina.descricao}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border">
        {query.isPending ? (
          <p className="p-6 text-sm text-slate-500">Carregando...</p>
        ) : query.isError ? (
          <p className="p-6 text-sm text-destructive">Não foi possível carregar as manutenções.</p>
        ) : manutencoes.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Nenhuma manutenção encontrada</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Máquina</TableHead>
                <TableHead>Problema</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Técnico</TableHead>
                <TableHead>Data Abertura</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {manutencoes.map((manutencao) => {
                const finalizada = manutencao.status === 'CONCLUIDA' || manutencao.status === 'CANCELADA'

                return (
                  <TableRow key={manutencao.id}>
                    <TableCell className="font-medium">{manutencao.maquinaCodigo}</TableCell>
                    <TableCell>{manutencao.problemaDescricao}</TableCell>
                    <TableCell>{TIPO_LABELS[manutencao.tipo]}</TableCell>
                    <TableCell>{STATUS_LABELS[manutencao.status]}</TableCell>
                    <TableCell>{manutencao.tecnicoResponsavel ?? '—'}</TableCell>
                    <TableCell>{formatarDataHora(manutencao.dataAbertura)}</TableCell>
                    <TableCell>
                      {finalizada ? (
                        <span className="text-sm text-slate-500">Finalizada</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          {manutencao.status === 'ABERTA' && <IniciarButton manutencao={manutencao} />}
                          <Button size="sm" onClick={() => setManutencaoAConcluir(manutencao)}>
                            Concluir
                          </Button>
                        </div>
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

      <ManutencaoFormDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
      <ManutencaoConcluirDialog
        open={Boolean(manutencaoAConcluir)}
        onOpenChange={(open) => {
          if (!open) setManutencaoAConcluir(null)
        }}
        manutencao={manutencaoAConcluir}
      />
    </section>
  )
}
