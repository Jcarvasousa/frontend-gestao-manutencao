import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buscarManutencoes } from '@/api/manutencoes'
import { buscarPecas } from '@/api/pecas'
import { criarSolicitacao } from '@/api/solicitacoesCompra'
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
import type { SolicitacaoCompraFormValues, SolicitacaoCompraPayload } from '@/types/SolicitacaoCompra'

interface SolicitacaoCompraFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type FieldErrors = Partial<Record<'pecaId' | 'quantidadeNecessaria', string>>

function valoresIniciais(): SolicitacaoCompraFormValues {
  return {
    pecaId: '',
    manutencaoId: '',
    quantidadeNecessaria: '',
    fornecedor: '',
    valorOrcamento: '',
  }
}

export function SolicitacaoCompraFormDialog({ open, onOpenChange }: SolicitacaoCompraFormDialogProps) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<SolicitacaoCompraFormValues>(() => valoresIniciais())
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

  const manutencoesQuery = useQuery({
    queryKey: ['manutencoes', { page: 0, size: 100 }],
    queryFn: () => buscarManutencoes({ page: 0, size: 100 }),
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: async (formValues: SolicitacaoCompraFormValues) => {
      const payload: SolicitacaoCompraPayload = {
        pecaId: Number(formValues.pecaId),
        manutencaoId: formValues.manutencaoId ? Number(formValues.manutencaoId) : null,
        quantidadeNecessaria: Number(formValues.quantidadeNecessaria),
        fornecedor: formValues.fornecedor.trim() || null,
        valorOrcamento: formValues.valorOrcamento === '' ? null : Number(formValues.valorOrcamento),
      }

      return criarSolicitacao(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['solicitacoes'] })
      onOpenChange(false)
    },
  })

  function handleChange<Field extends keyof SolicitacaoCompraFormValues>(
    field: Field,
    value: SolicitacaoCompraFormValues[Field],
  ) {
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
    if (!values.quantidadeNecessaria || Number(values.quantidadeNecessaria) < 1) {
      errors.quantidadeNecessaria = 'Informe uma quantidade válida.'
    }

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    mutation.mutate(values)
  }

  const pecas = pecasQuery.data?.content ?? []
  const manutencoes = manutencoesQuery.data?.content ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova solicitação de compra</DialogTitle>
          <DialogDescription>Preencha os dados para solicitar a compra de uma peça.</DialogDescription>
        </DialogHeader>

        {mutation.isError && (
          <p className="text-sm text-destructive" role="alert">
            Não foi possível criar a solicitação. Verifique os dados e tente novamente.
          </p>
        )}

        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="solicitacao-peca">Peça</Label>
            <select
              id="solicitacao-peca"
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
            <Label htmlFor="solicitacao-manutencao">Manutenção</Label>
            <select
              id="solicitacao-manutencao"
              value={values.manutencaoId}
              onChange={(event) => handleChange('manutencaoId', event.target.value)}
              className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            >
              <option value="">Nenhuma</option>
              {manutencoes.map((manutencao) => (
                <option key={manutencao.id} value={manutencao.id}>
                  {manutencao.maquinaCodigo} - {manutencao.problemaDescricao}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="solicitacao-quantidade">Quantidade necessária</Label>
            <Input
              id="solicitacao-quantidade"
              type="number"
              min="1"
              step="1"
              value={values.quantidadeNecessaria}
              onChange={(event) =>
                handleChange(
                  'quantidadeNecessaria',
                  event.target.value === '' ? '' : Number(event.target.value),
                )
              }
              aria-invalid={Boolean(fieldErrors.quantidadeNecessaria)}
            />
            {fieldErrors.quantidadeNecessaria && (
              <p className="text-sm text-destructive">{fieldErrors.quantidadeNecessaria}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="solicitacao-fornecedor">Fornecedor</Label>
            <Input
              id="solicitacao-fornecedor"
              value={values.fornecedor}
              onChange={(event) => handleChange('fornecedor', event.target.value)}
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="solicitacao-valor">Valor orçamento</Label>
            <Input
              id="solicitacao-valor"
              type="number"
              min="0"
              step="0.01"
              value={values.valorOrcamento}
              onChange={(event) =>
                handleChange('valorOrcamento', event.target.value === '' ? '' : Number(event.target.value))
              }
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
