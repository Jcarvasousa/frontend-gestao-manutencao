import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buscarMaquinas } from '@/api/maquinas'
import { criarManutencao } from '@/api/manutencoes'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ManutencaoFormValues, ManutencaoPayload, TipoManutencao } from '@/types/Manutencao'

interface ManutencaoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type FieldErrors = Partial<Record<'maquinaId' | 'problemaDescricao', string>>

const TIPO_OPTIONS: { value: TipoManutencao; label: string }[] = [
  { value: 'PREVENTIVA', label: 'Preventiva' },
  { value: 'CORRETIVA', label: 'Corretiva' },
]

function valoresIniciais(): ManutencaoFormValues {
  return {
    maquinaId: '',
    problemaDescricao: '',
    tipo: 'CORRETIVA',
    tecnicoResponsavel: '',
  }
}

export function ManutencaoFormDialog({ open, onOpenChange }: ManutencaoFormDialogProps) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<ManutencaoFormValues>(() => valoresIniciais())
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  useEffect(() => {
    if (open) {
      setValues(valoresIniciais())
      setFieldErrors({})
    }
  }, [open])

  const maquinasQuery = useQuery({
    queryKey: ['maquinas', { page: 0, size: 100 }],
    queryFn: () => buscarMaquinas({ page: 0, size: 100 }),
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: async (formValues: ManutencaoFormValues) => {
      const payload: ManutencaoPayload = {
        maquinaId: Number(formValues.maquinaId),
        problemaDescricao: formValues.problemaDescricao.trim(),
        tipo: formValues.tipo,
        tecnicoResponsavel: formValues.tecnicoResponsavel.trim() || null,
      }

      return criarManutencao(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['manutencoes'] })
      onOpenChange(false)
    },
  })

  function handleChange<Field extends keyof ManutencaoFormValues>(field: Field, value: ManutencaoFormValues[Field]) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }))
    setFieldErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors: FieldErrors = {}

    if (!values.maquinaId) errors.maquinaId = 'Selecione a máquina.'
    if (!values.problemaDescricao.trim()) errors.problemaDescricao = 'Informe o problema.'

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    mutation.mutate(values)
  }

  const maquinas = maquinasQuery.data?.content ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova manutenção</DialogTitle>
          <DialogDescription>Preencha os dados para abrir uma manutenção.</DialogDescription>
        </DialogHeader>

        {mutation.isError && (
          <p className="text-sm text-destructive" role="alert">
            Não foi possível criar a manutenção. Verifique os dados e tente novamente.
          </p>
        )}

        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="manutencao-maquina">Máquina</Label>
            <select
              id="manutencao-maquina"
              value={values.maquinaId}
              onChange={(event) => handleChange('maquinaId', event.target.value)}
              aria-invalid={Boolean(fieldErrors.maquinaId)}
              className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            >
              <option value="">Selecione...</option>
              {maquinas.map((maquina) => (
                <option key={maquina.id} value={maquina.id}>
                  {maquina.codigo} - {maquina.descricao}
                </option>
              ))}
            </select>
            {fieldErrors.maquinaId && <p className="text-sm text-destructive">{fieldErrors.maquinaId}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="manutencao-tipo">Tipo</Label>
            <select
              id="manutencao-tipo"
              value={values.tipo}
              onChange={(event) => handleChange('tipo', event.target.value as TipoManutencao)}
              className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            >
              {TIPO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="manutencao-problema">Problema</Label>
            <Input
              id="manutencao-problema"
              value={values.problemaDescricao}
              onChange={(event) => handleChange('problemaDescricao', event.target.value)}
              aria-invalid={Boolean(fieldErrors.problemaDescricao)}
            />
            {fieldErrors.problemaDescricao && <p className="text-sm text-destructive">{fieldErrors.problemaDescricao}</p>}
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="manutencao-tecnico">Técnico responsável</Label>
            <Input
              id="manutencao-tecnico"
              value={values.tecnicoResponsavel}
              onChange={(event) => handleChange('tecnicoResponsavel', event.target.value)}
            />
          </div>

          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
