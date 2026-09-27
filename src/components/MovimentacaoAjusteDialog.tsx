import { useEffect, useState } from 'react'
import axios from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buscarPecas } from '@/api/pecas'
import { registrarAjuste } from '@/api/movimentacoes'
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
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { MovimentacaoAjustePayload } from '@/types/MovimentacaoEstoque'
import { UNIDADE_MEDIDA_LABELS } from '@/types/UnidadeMedida'

interface MovimentacaoAjusteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface AjusteFormValues {
  pecaId: string
  quantidadeNova: string
  observacao: string
}

type FieldErrors = Partial<Record<'pecaId' | 'quantidadeNova' | 'observacao', string>>

function valoresIniciais(): AjusteFormValues {
  return {
    pecaId: '',
    quantidadeNova: '',
    observacao: '',
  }
}

function mensagemDeErro(error: unknown): string {
  if (axios.isAxiosError<{ mensagem?: string }>(error)) {
    const mensagem = error.response?.data?.mensagem
    if (mensagem) return mensagem
  }
  return 'Não foi possível registrar o ajuste. Verifique os dados e tente novamente.'
}

export function MovimentacaoAjusteDialog({ open, onOpenChange }: MovimentacaoAjusteDialogProps) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<AjusteFormValues>(() => valoresIniciais())
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const pecasQuery = useQuery({
    queryKey: ['pecas', { page: 0, size: 100 }],
    queryFn: () => buscarPecas({ page: 0, size: 100 }),
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: async (formValues: AjusteFormValues) => {
      const payload: MovimentacaoAjustePayload = {
        pecaId: Number(formValues.pecaId),
        quantidadeNova: Number(formValues.quantidadeNova),
        observacao: formValues.observacao.trim(),
      }

      return registrarAjuste(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['movimentacoes'] })
      await queryClient.invalidateQueries({ queryKey: ['pecas'] })
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
  }, [open, resetMutation])

  function handleChange<Field extends keyof AjusteFormValues>(field: Field, value: AjusteFormValues[Field]) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }))
    setFieldErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors: FieldErrors = {}
    const quantidadeNova = Number(values.quantidadeNova)

    if (!values.pecaId) errors.pecaId = 'Selecione a peça.'
    if (values.quantidadeNova === '' || !Number.isInteger(quantidadeNova) || quantidadeNova < 0) {
      errors.quantidadeNova = 'Informe uma quantidade válida (0 ou mais).'
    }
    if (!values.observacao.trim()) errors.observacao = 'Informe o motivo do ajuste.'

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    mutation.mutate(values)
  }

  const pecas = pecasQuery.data?.content ?? []
  const pecaSelecionada = pecas.find((peca) => String(peca.id) === values.pecaId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajustar estoque</DialogTitle>
          <DialogDescription>Informe o novo saldo total da peça e o motivo do ajuste.</DialogDescription>
        </DialogHeader>

        {mutation.isError && (
          <p className="text-sm text-destructive" role="alert">
            {mensagemDeErro(mutation.error)}
          </p>
        )}

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="ajuste-peca">Peça</Label>
            <Select
              id="ajuste-peca"
              placeholder="Selecione..."
              value={values.pecaId}
              onChange={(event) => handleChange('pecaId', event.target.value)}
              aria-invalid={Boolean(fieldErrors.pecaId)}
            >
              {pecas.map((peca) => (
                <option key={peca.id} value={peca.id}>
                  {peca.codigo} - {peca.nome}
                </option>
              ))}
            </Select>
            {fieldErrors.pecaId && <p className="text-sm text-destructive">{fieldErrors.pecaId}</p>}
            {pecaSelecionada && (
              <p className="text-sm text-slate-500">
                Saldo atual: {pecaSelecionada.quantidadeAtual}{' '}
                {UNIDADE_MEDIDA_LABELS[pecaSelecionada.unidadeMedida] ?? pecaSelecionada.unidadeMedida}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ajuste-quantidade-nova">Nova quantidade</Label>
            <Input
              id="ajuste-quantidade-nova"
              type="number"
              min="0"
              step="1"
              value={values.quantidadeNova}
              onChange={(event) => handleChange('quantidadeNova', event.target.value)}
              aria-invalid={Boolean(fieldErrors.quantidadeNova)}
            />
            {fieldErrors.quantidadeNova && <p className="text-sm text-destructive">{fieldErrors.quantidadeNova}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ajuste-observacao">Observação</Label>
            <Textarea
              id="ajuste-observacao"
              value={values.observacao}
              onChange={(event) => handleChange('observacao', event.target.value)}
              aria-invalid={Boolean(fieldErrors.observacao)}
            />
            {fieldErrors.observacao && <p className="text-sm text-destructive">{fieldErrors.observacao}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Ajustar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
