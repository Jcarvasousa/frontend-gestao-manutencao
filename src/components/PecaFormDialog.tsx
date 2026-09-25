import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { atualizarPeca, criarPeca } from '@/api/pecas'
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
import type { Peca, PecaFormValues, PecaPayload } from '@/types/Peca'

interface PecaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  peca?: Peca | null
}

type FieldErrors = Partial<Record<'codigo' | 'nome' | 'unidadeMedida' | 'quantidadeAtual', string>>

function valoresIniciais(peca?: Peca | null): PecaFormValues {
  return {
    codigo: peca?.codigo ?? '',
    nome: peca?.nome ?? '',
    categoria: peca?.categoria ?? '',
    unidadeMedida: peca?.unidadeMedida ?? '',
    localizacaoFisica: peca?.localizacaoFisica ?? '',
    quantidadeAtual: peca?.quantidadeAtual ?? 0,
    estoqueMinimo: peca?.estoqueMinimo ?? '',
    custoUnitario: peca?.custoUnitario ?? '',
  }
}

export function PecaFormDialog({ open, onOpenChange, peca }: PecaFormDialogProps) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<PecaFormValues>(() => valoresIniciais(peca))
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const isEditing = Boolean(peca)

  useEffect(() => {
    if (open) {
      setValues(valoresIniciais(peca))
      setFieldErrors({})
    }
  }, [open, peca])

  const mutation = useMutation({
    mutationFn: async (formValues: PecaFormValues) => {
      const payload: PecaPayload = {
        codigo: formValues.codigo.trim(),
        nome: formValues.nome.trim(),
        categoria: formValues.categoria.trim() || null,
        unidadeMedida: formValues.unidadeMedida.trim(),
        localizacaoFisica: formValues.localizacaoFisica.trim() || null,
        quantidadeAtual: formValues.quantidadeAtual,
        estoqueMinimo: formValues.estoqueMinimo === '' ? null : formValues.estoqueMinimo,
        custoUnitario: formValues.custoUnitario === '' ? null : formValues.custoUnitario,
      }

      return isEditing && peca ? atualizarPeca(peca.id, payload) : criarPeca(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pecas'] })
      onOpenChange(false)
    },
  })

  function handleChange<Field extends keyof PecaFormValues>(field: Field, value: PecaFormValues[Field]) {
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
    if (!values.nome.trim()) errors.nome = 'Informe o nome.'
    if (!values.unidadeMedida.trim()) errors.unidadeMedida = 'Informe a unidade de medida.'
    if (values.quantidadeAtual < 0) errors.quantidadeAtual = 'A quantidade não pode ser negativa.'

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    mutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar peça' : 'Nova peça'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize os dados da peça.' : 'Preencha os dados para cadastrar uma peça.'}
          </DialogDescription>
        </DialogHeader>

        {mutation.isError && (
          <p className="text-sm text-destructive" role="alert">
            Não foi possível salvar a peça. Verifique os dados e tente novamente.
          </p>
        )}

        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="peca-codigo">Código</Label>
            <Input
              id="peca-codigo"
              value={values.codigo}
              onChange={(event) => handleChange('codigo', event.target.value)}
              aria-invalid={Boolean(fieldErrors.codigo)}
            />
            {fieldErrors.codigo && <p className="text-sm text-destructive">{fieldErrors.codigo}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="peca-nome">Nome</Label>
            <Input
              id="peca-nome"
              value={values.nome}
              onChange={(event) => handleChange('nome', event.target.value)}
              aria-invalid={Boolean(fieldErrors.nome)}
            />
            {fieldErrors.nome && <p className="text-sm text-destructive">{fieldErrors.nome}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="peca-categoria">Categoria</Label>
            <Input
              id="peca-categoria"
              value={values.categoria}
              onChange={(event) => handleChange('categoria', event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="peca-unidade-medida">Unidade de Medida</Label>
            <Input
              id="peca-unidade-medida"
              value={values.unidadeMedida}
              onChange={(event) => handleChange('unidadeMedida', event.target.value)}
              aria-invalid={Boolean(fieldErrors.unidadeMedida)}
            />
            {fieldErrors.unidadeMedida && <p className="text-sm text-destructive">{fieldErrors.unidadeMedida}</p>}
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="peca-localizacao-fisica">Localização Física</Label>
            <Input
              id="peca-localizacao-fisica"
              value={values.localizacaoFisica}
              onChange={(event) => handleChange('localizacaoFisica', event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="peca-quantidade-atual">Quantidade Atual</Label>
            <Input
              id="peca-quantidade-atual"
              type="number"
              min="0"
              step="1"
              value={values.quantidadeAtual}
              onChange={(event) => handleChange('quantidadeAtual', Number(event.target.value))}
              aria-invalid={Boolean(fieldErrors.quantidadeAtual)}
            />
            {fieldErrors.quantidadeAtual && <p className="text-sm text-destructive">{fieldErrors.quantidadeAtual}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="peca-estoque-minimo">Estoque Mínimo</Label>
            <Input
              id="peca-estoque-minimo"
              type="number"
              min="0"
              step="1"
              value={values.estoqueMinimo}
              onChange={(event) => handleChange('estoqueMinimo', event.target.value === '' ? '' : Number(event.target.value))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="peca-custo-unitario">Custo Unitário</Label>
            <Input
              id="peca-custo-unitario"
              type="number"
              min="0"
              step="0.01"
              value={values.custoUnitario}
              onChange={(event) => handleChange('custoUnitario', event.target.value === '' ? '' : Number(event.target.value))}
            />
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
