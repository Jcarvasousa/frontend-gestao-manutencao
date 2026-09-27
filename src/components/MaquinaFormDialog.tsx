import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { atualizarMaquina, criarMaquina } from '@/api/maquinas'
import { buscarSetores } from '@/api/setores'
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
import type { Maquina, MaquinaFormValues, MaquinaPayload } from '@/types/Maquina'

interface MaquinaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  maquina?: Maquina | null
}

type FieldErrors = Partial<Record<'codigo' | 'descricao', string>>

function valoresIniciais(maquina?: Maquina | null): MaquinaFormValues {
  return {
    codigo: maquina?.codigo ?? '',
    descricao: maquina?.descricao ?? '',
    setorId: maquina?.setorId ?? null,
  }
}

export function MaquinaFormDialog({ open, onOpenChange, maquina }: MaquinaFormDialogProps) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<MaquinaFormValues>(() => valoresIniciais(maquina))
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const isEditing = Boolean(maquina)

  useEffect(() => {
    if (open) {
      setValues(valoresIniciais(maquina))
      setFieldErrors({})
    }
  }, [open, maquina])

  const setoresQuery = useQuery({
    queryKey: ['setores'],
    queryFn: buscarSetores,
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: async (formValues: MaquinaFormValues) => {
      const payload: MaquinaPayload = {
        codigo: formValues.codigo.trim(),
        descricao: formValues.descricao.trim(),
        setorId: formValues.setorId,
      }

      return isEditing && maquina ? atualizarMaquina(maquina.id, payload) : criarMaquina(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['maquinas'] })
      onOpenChange(false)
    },
  })

  function handleChange<Field extends keyof MaquinaFormValues>(field: Field, value: MaquinaFormValues[Field]) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }))
    setFieldErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors: FieldErrors = {}

    if (!values.codigo.trim()) errors.codigo = 'Informe o código.'
    if (!values.descricao.trim()) errors.descricao = 'Informe a descrição.'

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    mutation.mutate(values)
  }

  const setores = setoresQuery.data ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar máquina' : 'Nova máquina'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize os dados da máquina.' : 'Preencha os dados para cadastrar uma máquina.'}
          </DialogDescription>
        </DialogHeader>

        {mutation.isError && (
          <p className="text-sm text-destructive" role="alert">
            Não foi possível salvar a máquina. Verifique os dados e tente novamente.
          </p>
        )}

        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="maquina-codigo">Código</Label>
            <Input
              id="maquina-codigo"
              value={values.codigo}
              onChange={(event) => handleChange('codigo', event.target.value)}
              aria-invalid={Boolean(fieldErrors.codigo)}
            />
            {fieldErrors.codigo && <p className="text-sm text-destructive">{fieldErrors.codigo}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="maquina-setor">Setor</Label>
            <select
              id="maquina-setor"
              value={values.setorId ?? ''}
              onChange={(event) =>
                handleChange('setorId', event.target.value ? Number(event.target.value) : null)
              }
              className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            >
              <option value="">Selecione um setor</option>
              {setores.map((setor) => (
                <option key={setor.id} value={setor.id}>
                  {setor.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="maquina-descricao">Descrição</Label>
            <Input
              id="maquina-descricao"
              value={values.descricao}
              onChange={(event) => handleChange('descricao', event.target.value)}
              aria-invalid={Boolean(fieldErrors.descricao)}
            />
            {fieldErrors.descricao && <p className="text-sm text-destructive">{fieldErrors.descricao}</p>}
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
