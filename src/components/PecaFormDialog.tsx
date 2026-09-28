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
import { Select } from '@/components/ui/select'
import { mensagemDeErro } from '@/lib/erros'
import type { Peca, PecaEdicaoPayload, PecaFormValues, PecaPayload } from '@/types/Peca'
import { UNIDADE_MEDIDA_OPTIONS, type UnidadeMedida } from '@/types/UnidadeMedida'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

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
      const payloadEdicao: PecaEdicaoPayload = {
        codigo: formValues.codigo.trim(),
        nome: formValues.nome.trim(),
        categoria: formValues.categoria.trim() || null,
        unidadeMedida: formValues.unidadeMedida as UnidadeMedida,
        localizacaoFisica: formValues.localizacaoFisica.trim() || null,
        estoqueMinimo: formValues.estoqueMinimo === '' ? null : formValues.estoqueMinimo,
      }

      if (isEditing && peca) return atualizarPeca(peca.id, payloadEdicao)

      const payloadCriacao: PecaPayload = {
        ...payloadEdicao,
        quantidadeAtual: formValues.quantidadeAtual,
        custoUnitario: formValues.custoUnitario === '' ? null : formValues.custoUnitario,
      }
      return criarPeca(payloadCriacao)
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
    if (!values.unidadeMedida) errors.unidadeMedida = 'Informe a unidade de medida.'
    if (!isEditing && values.quantidadeAtual < 0) errors.quantidadeAtual = 'A quantidade não pode ser negativa.'

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
            {mensagemDeErro(mutation.error, 'Não foi possível salvar a peça. Verifique os dados e tente novamente.')}
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
            <Select
              id="peca-unidade-medida"
              placeholder="Selecione a unidade"
              value={values.unidadeMedida}
              onChange={(event) => handleChange('unidadeMedida', event.target.value as UnidadeMedida | '')}
              aria-invalid={Boolean(fieldErrors.unidadeMedida)}
            >
              {UNIDADE_MEDIDA_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
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
            {isEditing && peca ? (
              <>
                <p id="peca-quantidade-atual" className="text-sm font-medium">
                  {peca.quantidadeAtual}
                </p>
                <p className="text-xs text-muted-foreground">
                  Alterado apenas por movimentações e ajustes de estoque.
                </p>
              </>
            ) : (
              <>
                <Input
                  id="peca-quantidade-atual"
                  type="number"
                  min="0"
                  step="1"
                  value={values.quantidadeAtual}
                  onChange={(event) => handleChange('quantidadeAtual', Number(event.target.value))}
                  aria-invalid={Boolean(fieldErrors.quantidadeAtual)}
                />
                {fieldErrors.quantidadeAtual && (
                  <p className="text-sm text-destructive">{fieldErrors.quantidadeAtual}</p>
                )}
              </>
            )}
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
            {isEditing && peca ? (
              <>
                <p id="peca-custo-unitario" className="text-sm font-medium">
                  {peca.custoUnitario != null ? currencyFormatter.format(peca.custoUnitario) : 'Sem custo'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Atualizado automaticamente a cada compra recebida.
                </p>
              </>
            ) : (
              <Input
                id="peca-custo-unitario"
                type="number"
                min="0"
                step="0.01"
                value={values.custoUnitario}
                onChange={(event) => handleChange('custoUnitario', event.target.value === '' ? '' : Number(event.target.value))}
              />
            )}
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
