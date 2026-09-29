import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { buscarSetores } from '@/api/setores'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SetorFormDialog } from '@/components/SetorFormDialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Setor } from '@/types/Setor'

type FiltroStatus = '' | 'ativos' | 'inativos'

export function Setores() {
  const [nome, setNome] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<FiltroStatus>('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [setorEmEdicao, setSetorEmEdicao] = useState<Setor | null>(null)

  const query = useQuery({
    queryKey: ['setores', 'todos'],
    queryFn: () => buscarSetores(),
  })

  const termo = nome.trim().toLowerCase()
  const setores = (query.data ?? []).filter((setor) => {
    if (termo && !setor.nome.toLowerCase().includes(termo)) return false
    if (statusFiltro === 'ativos' && !setor.ativo) return false
    if (statusFiltro === 'inativos' && setor.ativo) return false
    return true
  })

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-sm font-medium text-muted-foreground">Módulo</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">Setores</h2>

      <div className="mt-6 flex justify-end">
        <Button onClick={() => setIsCreateDialogOpen(true)}>Novo setor</Button>
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
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium" htmlFor="filtro-status">
            Status
          </label>
          <select
            id="filtro-status"
            value={statusFiltro}
            onChange={(event) => {
              const valor = event.target.value
              setStatusFiltro(valor === 'ativos' || valor === 'inativos' ? valor : '')
            }}
            className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
          >
            <option value="">Todos</option>
            <option value="ativos">Ativos</option>
            <option value="inativos">Inativos</option>
          </select>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border">
        {query.isPending ? (
          <p className="p-6 text-sm text-muted-foreground">Carregando...</p>
        ) : query.isError ? (
          <p className="p-6 text-sm text-destructive">Não foi possível carregar os setores.</p>
        ) : setores.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhum setor encontrado</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {setores.map((setor) => (
                <TableRow key={setor.id}>
                  <TableCell className="font-medium">{setor.nome}</TableCell>
                  <TableCell>
                    {setor.ativo ? <Badge>Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}
                  </TableCell>
                  <TableCell>
                    <Button
                      aria-label={`Editar setor ${setor.nome}`}
                      title={`Editar setor ${setor.nome}`}
                      variant="ghost"
                      size="icon"
                      onClick={() => setSetorEmEdicao(setor)}
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

      <SetorFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
      <SetorFormDialog
        open={Boolean(setorEmEdicao)}
        onOpenChange={(open) => {
          if (!open) setSetorEmEdicao(null)
        }}
        setor={setorEmEdicao}
      />
    </section>
  )
}
