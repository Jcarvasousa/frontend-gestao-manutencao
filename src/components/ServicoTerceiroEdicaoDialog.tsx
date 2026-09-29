import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { atualizarServicoTerceiro } from '@/api/manutencoes'
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
import { currencyFormatter } from '@/lib/formatadores'
import { mensagemDeErro } from '@/lib/erros'
import { invalidarDadosDeManutencao } from '@/lib/manutencaoQueries'
import type { ServicoTerceiro, ServicoTerceiroAtualizacaoPayload } from '@/types/Manutencao'

interface ServicoTerceiroEdicaoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  servico: ServicoTerceiro | null
}

interface EdicaoFormValues {
  valorFinal: string
  observacao: string
}

type FieldErrors = Partial<Record<'valorFinal', string>>

function valoresIniciais(servico: ServicoTerceiro | null): EdicaoFormValues {
  return {
    valorFinal: servico?.valorFinal != null ? String(servico.valorFinal) : '',
    observacao: servico?.observacao ?? '',
  }
}

export function ServicoTerceiroEdicaoDialog({ open, onOpenChange, servico }: ServicoTerceiroEdicaoDialogProps) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<EdicaoFormValues>(() => valoresIniciais(servico))
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const mutation = useMutation({
    mutationFn: async (formValues: EdicaoFormValues) => {
      if (!servico) return null

      const payload: ServicoTerceiroAtualizacaoPayload = {
        valorFinal: formValues.valorFinal.trim() === '' ? null : Number(formValues.valorFinal),
        observacao: formValues.observacao.trim() || null,
      }

      return atualizarServicoTerceiro(servico.id, payload)
    },
    onSuccess: async () => {
      await invalidarDadosDeManutencao(queryClient)
      onOpenChange(false)
    },
  })

  const { reset: resetMutation } = mutation

  useEffect(() => {
    if (open) {
      setValues(valoresIniciais(servico))
      setFieldErrors({})
      resetMutation()
    }
  }, [open, servico, resetMutation])

  function handleChange<Field extends keyof EdicaoFormValues>(field: Field, value: EdicaoFormValues[Field]) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }))
    setFieldErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors: FieldErrors = {}

    if (values.valorFinal.trim() !== '') {
      const valorFinal = Number(values.valorFinal)
      if (!Number.isFinite(valorFinal) || valorFinal < 0) errors.valorFinal = 'Informe um valor de 0 ou mais.'
    }

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    mutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar serviço de terceiro</DialogTitle>
          <DialogDescription>{servico?.descricao ?? ''}</DialogDescription>
        </DialogHeader>

        {mutation.isError && (
          <p className="text-sm text-destructive" role="alert">
            {mensagemDeErro(mutation.error, 'Não foi possível salvar o serviço de terceiro. Tente novamente.')}
          </p>
        )}

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="terceiro-valor-final">Valor final (R$)</Label>
            <Input
              id="terceiro-valor-final"
              type="number"
              min="0"
              step="0.01"
              value={values.valorFinal}
              onChange={(event) => handleChange('valorFinal', event.target.value)}
              aria-invalid={Boolean(fieldErrors.valorFinal)}
            />
            <p className="text-sm text-muted-foreground">
              {servico?.valorApurado != null
                ? `Valor apurado: ${currencyFormatter.format(servico.valorApurado)}. `
                : ''}
              Deixe em branco para usar o valor apurado.
            </p>
            {fieldErrors.valorFinal && <p className="text-sm text-destructive">{fieldErrors.valorFinal}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="terceiro-observacao">Observação</Label>
            <Input
              id="terceiro-observacao"
              value={values.observacao}
              onChange={(event) => handleChange('observacao', event.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending || !servico}>
              {mutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
