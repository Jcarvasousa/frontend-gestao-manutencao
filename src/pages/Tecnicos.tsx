import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { buscarTecnicos } from '@/api/tecnicos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TecnicoFormDialog } from '@/components/TecnicoFormDialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import type { Tecnico } from '@/types/Tecnico'

const PAGE_SIZE = 10

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function Tecnicos() {
  const [page, setPage] = useState(0)
  const [nome, setNome] = useState('')
  const [debouncedNome, setDebouncedNome] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [tecnicoEmEdicao, setTecnicoEmEdicao] = useState<Tecnico | null>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedNome(nome.trim())
      setPage(0)
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [nome])

  const query = useQuery({
    queryKey: ['tecnicos', { page, size: PAGE_SIZE, nome: debouncedNome }],
    queryFn: () => buscarTecnicos({
      page,
      size: PAGE_SIZE,
      nome: debouncedNome || undefined,
    }),
  })

  const paginaAtual = (query.data?.number ?? page) + 1
  const totalPaginas = query.data?.totalPages ?? 0
  const tecnicos = query.data?.content ?? []

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-sm font-medium text-slate-500">Módulo</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">Técnicos</h2>

      <div className="mt-6 flex justify-end">
        <Button onClick={() => setIsCreateDialogOpen(true)}>Novo Técnico</Button>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium" htmlFor="filtro-nome">
            Nome
          </label>
          <Input
            id="filtro-nome"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            placeholder="Filtrar por nome"
          />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border">
        {query.isPending ? (
          <p className="p-6 text-sm text-slate-500">Carregando...</p>
        ) : query.isError ? (
          <p className="p-6 text-sm text-destructive">Não foi possível carregar os técnicos.</p>
        ) : tecnicos.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Nenhum técnico encontrado</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Salário mensal</TableHead>
                <TableHead>Carga horária diária</TableHead>
                <TableHead>Custo por hora</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tecnicos.map((tecnico) => (
                <TableRow key={tecnico.id}>
                  <TableCell className="font-medium">{tecnico.nome}</TableCell>
                  <TableCell>{currencyFormatter.format(tecnico.salarioMensal)}</TableCell>
                  <TableCell>{tecnico.cargaHorariaDiaria} h</TableCell>
                  <TableCell>{currencyFormatter.format(tecnico.custoPorHora)}</TableCell>
                  <TableCell>
                    {tecnico.ativo ? <Badge>Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}
                  </TableCell>
                  <TableCell>
                    <Button
                      aria-label={`Editar técnico ${tecnico.nome}`}
                      title={`Editar técnico ${tecnico.nome}`}
                      variant="ghost"
                      size="icon"
                      onClick={() => setTecnicoEmEdicao(tecnico)}
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

      <TecnicoFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
      <TecnicoFormDialog
        open={Boolean(tecnicoEmEdicao)}
        onOpenChange={(open) => {
          if (!open) setTecnicoEmEdicao(null)
        }}
        tecnico={tecnicoEmEdicao}
      />
    </section>
  )
}
