import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buscarPecas } from '@/api/pecas'
import { registrarEntrada } from '@/api/movimentacoes'
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
import type { MovimentacaoEntradaPayload } from '@/types/MovimentacaoEstoque'

interface MovimentacaoEntradaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface EntradaFormValues {
  pecaId: string
  quantidade: string
  observacao: string
}

type FieldErrors = Partial<Record<'pecaId' | 'quantidade', string>>

function valoresIniciais(): EntradaFormValues {
  return {
    pecaId: '',
    quantidade: '',
    observacao: '',
  }
}

export function MovimentacaoEntradaDialog({ open, onOpenChange }: MovimentacaoEntradaDialogProps) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<EntradaFormValues>(() => valoresIniciais())
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  useEffect(() => {
    if (open) {
      setValues(valoresIniciais())
      setFieldErrors({})
    }
  }, [open])

  const pecasQuery = useQuery({
    queryKey: ['pecas', { page: 0, size: 100 }],
    queryFn: () => buscarPecas({ page: 0, size: 100 }),
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: async (formValues: EntradaFormValues) => {
      const payload: MovimentacaoEntradaPayload = {
        pecaId: Number(formValues.pecaId),
        quantidade: Number(formValues.quantidade),
        observacao: formValues.observacao.trim() || null,
      }

      return registrarEntrada(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['movimentacoes'] })
      await queryClient.invalidateQueries({ queryKey: ['pecas'] })
      onOpenChange(false)
    },
  })

  function handleChange<Field extends keyof EntradaFormValues>(field: Field, value: EntradaFormValues[Field]) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }))
    setFieldErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors: FieldErrors = {}

    if (!values.pecaId) errors.pecaId = 'Selecione a peça.'
    if (!values.quantidade || Number(values.quantidade) < 1) errors.quantidade = 'Informe uma quantidade válida.'

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    mutation.mutate(values)
  }

  const pecas = pecasQuery.data?.content ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar entrada</DialogTitle>
          <DialogDescription>Informe a peça e a quantidade que entrou no estoque.</DialogDescription>
        </DialogHeader>

        {mutation.isError && (
          <p className="text-sm text-destructive" role="alert">
            Não foi possível registrar a entrada. Verifique os dados e tente novamente.
          </p>
        )}

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="entrada-peca">Peça</Label>
            <select
              id="entrada-peca"
              value={values.pecaId}
              onChange={(event) => handleChange('pecaId', event.target.value)}
              aria-invalid={Boolean(fieldErrors.pecaId)}
              className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            >
              <option value="">Selecione...</option>
              {pecas.map((peca) => (
                <option key={peca.id} value={peca.id}>
                  {peca.codigo} - {peca.nome}
                </option>
              ))}
            </select>
            {fieldErrors.pecaId && <p className="text-sm text-destructive">{fieldErrors.pecaId}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="entrada-quantidade">Quantidade</Label>
            <Input
              id="entrada-quantidade"
              type="number"
              min="1"
              step="1"
              value={values.quantidade}
              onChange={(event) => handleChange('quantidade', event.target.value)}
              aria-invalid={Boolean(fieldErrors.quantidade)}
            />
            {fieldErrors.quantidade && <p className="text-sm text-destructive">{fieldErrors.quantidade}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="entrada-observacao">Observação</Label>
            <Input
              id="entrada-observacao"
              value={values.observacao}
              onChange={(event) => handleChange('observacao', event.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
