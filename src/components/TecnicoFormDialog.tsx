import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { atualizarTecnico, criarTecnico } from '@/api/tecnicos'
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
import type { Tecnico, TecnicoFormValues, TecnicoPayload } from '@/types/Tecnico'

interface TecnicoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tecnico?: Tecnico | null
}

type FieldErrors = Partial<Record<'nome' | 'salarioMensal' | 'cargaHorariaDiaria', string>>

function valoresIniciais(tecnico?: Tecnico | null): TecnicoFormValues {
  return {
    nome: tecnico?.nome ?? '',
    salarioMensal: tecnico ? String(tecnico.salarioMensal) : '',
    cargaHorariaDiaria: tecnico ? String(tecnico.cargaHorariaDiaria) : '',
    ativo: tecnico?.ativo ?? true,
  }
}

function numeroInvalido(valor: string): boolean {
  const numero = Number(valor)
  return valor.trim() === '' || !Number.isFinite(numero) || numero < 0
}

export function TecnicoFormDialog({ open, onOpenChange, tecnico }: TecnicoFormDialogProps) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<TecnicoFormValues>(() => valoresIniciais(tecnico))
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const isEditing = Boolean(tecnico)

  useEffect(() => {
    if (open) {
      setValues(valoresIniciais(tecnico))
      setFieldErrors({})
    }
  }, [open, tecnico])

  const mutation = useMutation({
    mutationFn: async (formValues: TecnicoFormValues) => {
      const payload: TecnicoPayload = {
        nome: formValues.nome.trim(),
        salarioMensal: Number(formValues.salarioMensal),
        cargaHorariaDiaria: Number(formValues.cargaHorariaDiaria),
        ativo: formValues.ativo,
      }

      return isEditing && tecnico ? atualizarTecnico(tecnico.id, payload) : criarTecnico(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tecnicos'] })
      onOpenChange(false)
    },
  })

  function handleChange<Field extends keyof TecnicoFormValues>(field: Field, value: TecnicoFormValues[Field]) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }))
    setFieldErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors: FieldErrors = {}

    if (!values.nome.trim()) errors.nome = 'Informe o nome.'
    if (numeroInvalido(values.salarioMensal)) errors.salarioMensal = 'Informe um salário válido (0 ou mais).'
    if (numeroInvalido(values.cargaHorariaDiaria)) {
      errors.cargaHorariaDiaria = 'Informe uma carga horária válida (0 ou mais).'
    }

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    mutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar técnico' : 'Novo técnico'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize os dados do técnico.' : 'Preencha os dados para cadastrar um técnico.'}
          </DialogDescription>
        </DialogHeader>

        {mutation.isError && (
          <p className="text-sm text-destructive" role="alert">
            Não foi possível salvar o técnico. Verifique os dados e tente novamente.
          </p>
        )}

        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="tecnico-nome">Nome</Label>
            <Input
              id="tecnico-nome"
              value={values.nome}
              onChange={(event) => handleChange('nome', event.target.value)}
              aria-invalid={Boolean(fieldErrors.nome)}
            />
            {fieldErrors.nome && <p className="text-sm text-destructive">{fieldErrors.nome}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tecnico-salario">Salário mensal (R$)</Label>
            <Input
              id="tecnico-salario"
              type="number"
              min="0"
              step="0.01"
              value={values.salarioMensal}
              onChange={(event) => handleChange('salarioMensal', event.target.value)}
              aria-invalid={Boolean(fieldErrors.salarioMensal)}
            />
            {fieldErrors.salarioMensal && <p className="text-sm text-destructive">{fieldErrors.salarioMensal}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tecnico-carga-horaria">Carga horária diária (h)</Label>
            <Input
              id="tecnico-carga-horaria"
              type="number"
              min="0"
              step="0.5"
              value={values.cargaHorariaDiaria}
              onChange={(event) => handleChange('cargaHorariaDiaria', event.target.value)}
              aria-invalid={Boolean(fieldErrors.cargaHorariaDiaria)}
            />
            {fieldErrors.cargaHorariaDiaria && (
              <p className="text-sm text-destructive">{fieldErrors.cargaHorariaDiaria}</p>
            )}
          </div>

          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              id="tecnico-ativo"
              type="checkbox"
              checked={values.ativo}
              onChange={(event) => handleChange('ativo', event.target.checked)}
              className="size-4 rounded border-input"
            />
            <Label htmlFor="tecnico-ativo">Ativo</Label>
          </div>

          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
