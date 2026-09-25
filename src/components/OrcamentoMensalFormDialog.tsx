import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { atualizarOrcamento, criarOrcamento } from '@/api/orcamentosMensais'
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
import { nomeMes } from '@/lib/meses'
import type { OrcamentoMensal } from '@/types/OrcamentoMensal'

interface OrcamentoMensalFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mes: number
  ano: number
  orcamentoExistente: OrcamentoMensal | null
}

export function OrcamentoMensalFormDialog({
  open,
  onOpenChange,
  mes,
  ano,
  orcamentoExistente,
}: OrcamentoMensalFormDialogProps) {
  const queryClient = useQueryClient()
  const [valorPlanejado, setValorPlanejado] = useState('')
  const [erro, setErro] = useState<string | undefined>(undefined)
  const isEditing = Boolean(orcamentoExistente)

  useEffect(() => {
    if (open) {
      setValorPlanejado(orcamentoExistente ? String(orcamentoExistente.valorPlanejado) : '')
      setErro(undefined)
    }
  }, [open, orcamentoExistente])

  const mutation = useMutation({
    mutationFn: async (valor: number) => {
      return isEditing
        ? atualizarOrcamento(mes, ano, valor)
        : criarOrcamento({ mes, ano, valorPlanejado: valor })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orcamentos-mensais', ano] })
      onOpenChange(false)
    },
  })

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const valor = Number(valorPlanejado.replace(',', '.'))

    if (!valorPlanejado.trim() || Number.isNaN(valor) || valor <= 0) {
      setErro('Informe um valor positivo.')
      return
    }

    setErro(undefined)
    mutation.mutate(valor)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Orçamento de {nomeMes(mes)} de {ano}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize o valor planejado para o mês.' : 'Cadastre o valor planejado para o mês.'}
          </DialogDescription>
        </DialogHeader>

        {mutation.isError && (
          <p className="text-sm text-destructive" role="alert">
            Não foi possível salvar o orçamento. Verifique os dados e tente novamente.
          </p>
        )}

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="orcamento-valor">Valor planejado</Label>
            <Input
              id="orcamento-valor"
              type="number"
              step="0.01"
              min="0"
              value={valorPlanejado}
              onChange={(event) => {
                setValorPlanejado(event.target.value)
                setErro(undefined)
              }}
              aria-invalid={Boolean(erro)}
            />
            {erro && <p className="text-sm text-destructive">{erro}</p>}
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
