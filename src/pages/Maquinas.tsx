import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { atualizarStatusMaquina, buscarMaquinas } from '@/api/maquinas'
import { Button } from '@/components/ui/button'
import { MaquinaFormDialog } from '@/components/MaquinaFormDialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import type { Maquina, StatusMaquina } from '@/types/Maquina'

const PAGE_SIZE = 10

const STATUS_OPTIONS: { value: StatusMaquina; label: string }[] = [
  { value: 'ATIVA', label: 'Ativa' },
  { value: 'PARADA', label: 'Parada' },
  { value: 'EM_MANUTENCAO', label: 'Em manutenção' },
  { value: 'INATIVA', label: 'Inativa' },
]

function StatusSelect({ maquina }: { maquina: Maquina }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (status: StatusMaquina) => atualizarStatusMaquina(maquina.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maquinas'] })
    },
    onError: (error) => {
      console.error('Falha ao atualizar status da máquina', error)
    },
  })

  return (
    <select
      aria-label={`Status da máquina ${maquina.codigo}`}
      value={maquina.status}
      disabled={mutation.isPending}
      onChange={(event) => mutation.mutate(event.target.value as StatusMaquina)}
      className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
    >
      {STATUS_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export function Maquinas() {
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState<StatusMaquina | ''>('')
  const [setor, setSetor] = useState('')
  const [codigo, setCodigo] = useState('')
  const [debouncedSetor, setDebouncedSetor] = useState('')
  const [debouncedCodigo, setDebouncedCodigo] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [maquinaEmEdicao, setMaquinaEmEdicao] = useState<Maquina | null>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSetor(setor.trim())
      setDebouncedCodigo(codigo.trim())
      setPage(0)
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [setor, codigo])

  const query = useQuery({
    queryKey: ['maquinas', { page, size: PAGE_SIZE, status: status || undefined, setor: debouncedSetor, codigo: debouncedCodigo }],
    queryFn: () => buscarMaquinas({
      page,
      size: PAGE_SIZE,
      status: status || undefined,
      setor: debouncedSetor || undefined,
      codigo: debouncedCodigo || undefined,
    }),
  })

  const paginaAtual = (query.data?.number ?? page) + 1
  const totalPaginas = query.data?.totalPages ?? 0
  const maquinas = query.data?.content ?? []

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-sm font-medium text-slate-500">Módulo</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">Máquinas</h2>

      <div className="mt-6 flex justify-end">
        <Button onClick={() => setIsCreateDialogOpen(true)}>Nova Máquina</Button>
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
              setStatus(event.target.value as StatusMaquina | '')
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
          <label className="mb-1.5 block text-sm font-medium" htmlFor="filtro-setor">
            Setor
          </label>
          <Input
            id="filtro-setor"
            value={setor}
            onChange={(event) => setSetor(event.target.value)}
            placeholder="Filtrar por setor"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium" htmlFor="filtro-codigo">
            Código
          </label>
          <Input
            id="filtro-codigo"
            value={codigo}
            onChange={(event) => setCodigo(event.target.value)}
            placeholder="Filtrar por código"
          />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border">
        {query.isPending ? (
          <p className="p-6 text-sm text-slate-500">Carregando...</p>
        ) : query.isError ? (
          <p className="p-6 text-sm text-destructive">Não foi possível carregar as máquinas.</p>
        ) : maquinas.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Nenhuma máquina encontrada</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maquinas.map((maquina) => (
                <TableRow key={maquina.id}>
                  <TableCell className="font-medium">{maquina.codigo}</TableCell>
                  <TableCell>{maquina.descricao}</TableCell>
                  <TableCell>{maquina.setor ?? '—'}</TableCell>
                  <TableCell>
                    <StatusSelect maquina={maquina} />
                  </TableCell>
                  <TableCell>
                    <Button
                      aria-label={`Editar máquina ${maquina.codigo}`}
                      title={`Editar máquina ${maquina.codigo}`}
                      variant="ghost"
                      size="icon"
                      onClick={() => setMaquinaEmEdicao(maquina)}
                    >
                      <Pencil aria-hidden="true" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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

      <MaquinaFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
      <MaquinaFormDialog
        open={Boolean(maquinaEmEdicao)}
        onOpenChange={(open) => {
          if (!open) setMaquinaEmEdicao(null)
        }}
        maquina={maquinaEmEdicao}
      />
    </section>
  )
}
