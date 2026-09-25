import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Pencil } from 'lucide-react'
import { buscarPecas } from '@/api/pecas'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PecaFormDialog } from '@/components/PecaFormDialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import type { Peca } from '@/types/Peca'

const PAGE_SIZE = 10

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function Pecas() {
  const [page, setPage] = useState(0)
  const [categoria, setCategoria] = useState('')
  const [codigo, setCodigo] = useState('')
  const [debouncedCategoria, setDebouncedCategoria] = useState('')
  const [debouncedCodigo, setDebouncedCodigo] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [pecaEmEdicao, setPecaEmEdicao] = useState<Peca | null>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedCategoria(categoria.trim())
      setDebouncedCodigo(codigo.trim())
      setPage(0)
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [categoria, codigo])

  const query = useQuery({
    queryKey: ['pecas', { page, size: PAGE_SIZE, categoria: debouncedCategoria, codigo: debouncedCodigo }],
    queryFn: () => buscarPecas({
      page,
      size: PAGE_SIZE,
      categoria: debouncedCategoria || undefined,
      codigo: debouncedCodigo || undefined,
    }),
  })

  const paginaAtual = (query.data?.number ?? page) + 1
  const totalPaginas = query.data?.totalPages ?? 0
  const pecas = query.data?.content ?? []

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-sm font-medium text-slate-500">Módulo</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">Peças</h2>

      <div className="mt-6 flex justify-end">
        <Button onClick={() => setIsCreateDialogOpen(true)}>Nova Peça</Button>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium" htmlFor="filtro-categoria">
            Categoria
          </label>
          <Input
            id="filtro-categoria"
            value={categoria}
            onChange={(event) => setCategoria(event.target.value)}
            placeholder="Filtrar por categoria"
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
          <p className="p-6 text-sm text-destructive">Não foi possível carregar as peças.</p>
        ) : pecas.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Nenhuma peça encontrada</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Quantidade Atual</TableHead>
                <TableHead>Estoque Mínimo</TableHead>
                <TableHead>Custo Unitário</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pecas.map((peca) => (
                  <TableRow key={peca.id}>
                    <TableCell className="font-medium">{peca.codigo}</TableCell>
                    <TableCell>{peca.nome}</TableCell>
                    <TableCell>{peca.categoria ?? '—'}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        {peca.quantidadeAtual} {peca.unidadeMedida}
                        {peca.abaixoDoMinimo && (
                          <Badge variant="destructive">
                            <AlertTriangle aria-hidden="true" />
                            Baixo
                          </Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      {peca.estoqueMinimo != null ? `${peca.estoqueMinimo} ${peca.unidadeMedida}` : '—'}
                    </TableCell>
                    <TableCell>
                      {peca.custoUnitario != null ? currencyFormatter.format(peca.custoUnitario) : '—'}
                    </TableCell>
                    <TableCell>
                      <Button
                        aria-label={`Editar peça ${peca.codigo}`}
                        title={`Editar peça ${peca.codigo}`}
                        variant="ghost"
                        size="icon"
                        onClick={() => setPecaEmEdicao(peca)}
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

      <PecaFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
      <PecaFormDialog
        open={Boolean(pecaEmEdicao)}
        onOpenChange={(open) => {
          if (!open) setPecaEmEdicao(null)
        }}
        peca={pecaEmEdicao}
      />
    </section>
  )
}
