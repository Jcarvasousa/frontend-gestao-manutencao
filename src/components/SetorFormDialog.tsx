import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { atualizarSetor, criarSetor } from '@/api/setores'
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
import { mensagemDeErro } from '@/lib/erros'
import type { Setor, SetorFormValues, SetorPayload } from '@/types/Setor'

interface SetorFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  setor?: Setor | null
}

type FieldErrors = Partial<Record<'nome', string>>

function valoresIniciais(setor?: Setor | null): SetorFormValues {
  return {
    nome: setor?.nome ?? '',
    ativo: setor?.ativo ?? true,
  }
}

export function SetorFormDialog({ open, onOpenChange, setor }: SetorFormDialogProps) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<SetorFormValues>(() => valoresIniciais(setor))
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const isEditing = Boolean(setor)

  const mutation = useMutation({
    mutationFn: async (formValues: SetorFormValues) => {
      const payload: SetorPayload = {
        nome: formValues.nome.trim(),
        ativo: formValues.ativo,
      }

      return isEditing && setor ? atualizarSetor(setor.id, payload) : criarSetor(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['setores'] })
      onOpenChange(false)
    },
  })
  const { reset: resetMutation } = mutation

  useEffect(() => {
    if (open) {
      setValues(valoresIniciais(setor))
      setFieldErrors({})
      resetMutation()
    }
  }, [open, setor, resetMutation])

  function handleChange<Field extends keyof SetorFormValues>(field: Field, value: SetorFormValues[Field]) {
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

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    mutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar setor' : 'Novo setor'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize os dados do setor.' : 'Preencha os dados para cadastrar um setor.'}
          </DialogDescription>
        </DialogHeader>

        {mutation.isError && (
          <p className="text-sm text-destructive" role="alert">
            {mensagemDeErro(mutation.error, 'Não foi possível salvar o setor. Verifique os dados e tente novamente.')}
          </p>
        )}

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="setor-nome">Nome</Label>
            <Input
              id="setor-nome"
              value={values.nome}
              onChange={(event) => handleChange('nome', event.target.value)}
              aria-invalid={Boolean(fieldErrors.nome)}
            />
            {fieldErrors.nome && <p className="text-sm text-destructive">{fieldErrors.nome}</p>}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="setor-ativo"
              type="checkbox"
              checked={values.ativo}
              onChange={(event) => handleChange('ativo', event.target.checked)}
              className="size-4 rounded border-input"
            />
            <Label htmlFor="setor-ativo">Ativo</Label>
          </div>

          <DialogFooter>
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
