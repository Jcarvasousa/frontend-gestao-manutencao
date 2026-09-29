import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { registrarDevolucao } from '@/api/movimentacoes'
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
import { invalidarDadosDeManutencao } from '@/lib/manutencaoQueries'
import type { PecaUsada } from '@/types/Manutencao'
import type { MovimentacaoDevolucaoPayload } from '@/types/MovimentacaoEstoque'
import { UNIDADE_MEDIDA_LABELS } from '@/types/UnidadeMedida'

interface PecaDevolucaoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  manutencaoId: number
  pecaUsada: PecaUsada | null
}

interface DevolucaoFormValues {
  quantidade: string
  observacao: string
}

type FieldErrors = Partial<Record<'quantidade', string>>

function valoresIniciais(): DevolucaoFormValues {
  return {
    quantidade: '',
    observacao: '',
  }
}

export function PecaDevolucaoDialog({ open, onOpenChange, manutencaoId, pecaUsada }: PecaDevolucaoDialogProps) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<DevolucaoFormValues>(() => valoresIniciais())
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const mutation = useMutation({
    mutationFn: async (formValues: DevolucaoFormValues) => {
      if (!pecaUsada) return []

      const payload: MovimentacaoDevolucaoPayload = {
        pecaId: pecaUsada.pecaId,
        manutencaoId,
        quantidade: Number(formValues.quantidade),
        observacao: formValues.observacao.trim() || null,
      }

      return registrarDevolucao(payload)
    },
    onSuccess: async () => {
      await invalidarDadosDeManutencao(queryClient)
      onOpenChange(false)
    },
  })

  const { reset: resetMutation } = mutation

  useEffect(() => {
    if (open) {
      setValues(valoresIniciais())
      setFieldErrors({})
      resetMutation()
    }
  }, [open, pecaUsada, resetMutation])

  function handleChange<Field extends keyof DevolucaoFormValues>(field: Field, value: DevolucaoFormValues[Field]) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }))
    setFieldErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!pecaUsada) return

    const errors: FieldErrors = {}
    const quantidade = Number(values.quantidade)

    if (values.quantidade === '' || !Number.isInteger(quantidade) || quantidade < 1) {
      errors.quantidade = 'Informe uma quantidade inteira de 1 ou mais.'
    } else if (quantidade > pecaUsada.saldoDevolvivel) {
      errors.quantidade = `A quantidade máxima devolvível é ${pecaUsada.saldoDevolvivel}.`
    }

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    mutation.mutate(values)
  }

  const unidade = pecaUsada ? (UNIDADE_MEDIDA_LABELS[pecaUsada.unidadeMedida] ?? pecaUsada.unidadeMedida) : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Devolver peça ao estoque</DialogTitle>
          <DialogDescription>
            {pecaUsada ? `${pecaUsada.pecaCodigo} - ${pecaUsada.pecaNome}` : ''}
          </DialogDescription>
        </DialogHeader>

        {mutation.isError && (
          <p className="text-sm text-destructive" role="alert">
            {mensagemDeErro(mutation.error, 'Não foi possível registrar a devolução. Tente novamente.')}
          </p>
        )}

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="devolucao-quantidade">Quantidade</Label>
            <Input
              id="devolucao-quantidade"
              type="number"
              min="1"
              max={pecaUsada?.saldoDevolvivel}
              step="1"
              value={values.quantidade}
              onChange={(event) => handleChange('quantidade', event.target.value)}
              aria-invalid={Boolean(fieldErrors.quantidade)}
            />
            {pecaUsada && (
              <p className="text-sm text-muted-foreground">
                Saldo devolvível: {pecaUsada.saldoDevolvivel} {unidade}
              </p>
            )}
            {fieldErrors.quantidade && <p className="text-sm text-destructive">{fieldErrors.quantidade}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="devolucao-observacao">Observação</Label>
            <Input
              id="devolucao-observacao"
              value={values.observacao}
              onChange={(event) => handleChange('observacao', event.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending || !pecaUsada}>
              {mutation.isPending ? 'Devolvendo...' : 'Devolver'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
