import { useQuery } from '@tanstack/react-query'
import { buscarSetores } from '@/api/setores'
import { Button } from '@/components/ui/button'

interface SetorCheckListProps {
  value: number[]
  onChange: (setorIds: number[]) => void
}

export function SetorCheckList({ value, onChange }: SetorCheckListProps) {
  const query = useQuery({ queryKey: ['setores', 'todos'], queryFn: () => buscarSetores() })
  const setores = query.data ?? []

  function alternar(id: number, marcado: boolean) {
    onChange(marcado ? [...value, id] : value.filter((atual) => atual !== id))
  }

  return (
    <fieldset>
      <div className="flex items-center justify-between gap-2">
        <legend className="text-sm font-medium">Setores</legend>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={setores.length === 0}
            onClick={() => onChange(setores.map((setor) => setor.id))}
          >
            Todos
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={value.length === 0} onClick={() => onChange([])}>
            Limpar
          </Button>
        </div>
      </div>
      {query.isPending ? (
        <p className="mt-2 text-sm text-slate-500">Carregando setores...</p>
      ) : query.isError ? (
        <p className="mt-2 text-sm text-destructive">Não foi possível carregar os setores.</p>
      ) : setores.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Nenhum setor cadastrado.</p>
      ) : (
        <div className="mt-2 grid max-h-48 grid-cols-1 gap-x-4 gap-y-1 overflow-y-auto rounded-lg border p-2 sm:grid-cols-2 lg:grid-cols-3">
          {setores.map((setor) => (
            <label
              key={setor.id}
              className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm has-focus-visible:ring-3 has-focus-visible:ring-ring/50 hover:bg-accent"
            >
              <input
                type="checkbox"
                checked={value.includes(setor.id)}
                onChange={(event) => alternar(setor.id, event.target.checked)}
                className="size-4 rounded border-input"
              />
              <span>
                {setor.nome}
                {!setor.ativo && <span className="text-muted-foreground"> (inativo)</span>}
              </span>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  )
}
