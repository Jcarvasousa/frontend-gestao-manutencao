import { useEffect, useState } from 'react'
import axios from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { marcarComoRecebida } from '@/api/solicitacoesCompra'
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
import type { SolicitacaoCompra } from '@/types/SolicitacaoCompra'

interface ReceberCompraDialogProps {
  solicitacao: SolicitacaoCompra
  open: boolean
  onOpenChange: (open: boolean) => void
}

const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function mensagemDeErro(error: unknown): string {
  if (axios.isAxiosError<{ mensagem?: string }>(error)) {
    const mensagem = error.response?.data?.mensagem
    if (mensagem) return mensagem
  }
  return 'Não foi possível registrar o recebimento. Verifique os dados e tente novamente.'
}

export function ReceberCompraDialog({ solicitacao, open, onOpenChange }: ReceberCompraDialogProps) {
  const queryClient = useQueryClient()
  const [valor, setValor] = useState('')
  const [erro, setErro] = useState('')

  const mutation = useMutation({
    mutationFn: () => marcarComoRecebida(solicitacao.id, { valorOrcamento: Number(valor) }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['solicitacoes'] })
      await queryClient.invalidateQueries({ queryKey: ['solicitacoes-pendentes'] })
      await queryClient.invalidateQueries({ queryKey: ['pecas'] })
      onOpenChange(false)
    },
    onError: async (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        await queryClient.invalidateQueries({ queryKey: ['solicitacoes'] })
        await queryClient.invalidateQueries({ queryKey: ['solicitacoes-pendentes'] })
      }
    },
  })

  const { reset: resetMutation } = mutation

  useEffect(() => {
    if (open) {
      setValor('')
      setErro('')
      resetMutation()
    }
  }, [open, resetMutation])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!(Number(valor) > 0)) {
      setErro('Informe um valor maior que zero.')
      return
    }

    setErro('')
    mutation.mutate()
  }

  const valorNumerico = Number(valor)
  const unitario = Math.round((valorNumerico / solicitacao.quantidadeNecessaria) * 100) / 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receber compra</DialogTitle>
          <DialogDescription>
            {solicitacao.pecaCodigo} - {solicitacao.pecaNome}: {solicitacao.quantidadeNecessaria} unidades
          </DialogDescription>
        </DialogHeader>

        {mutation.isError && (
          <p className="text-sm text-destructive" role="alert">
            {mensagemDeErro(mutation.error)}
          </p>
        )}

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="receber-valor">Valor total pago (R$)</Label>
            <Input
              id="receber-valor"
              type="number"
              min="0.01"
              step="0.01"
              value={valor}
              onChange={(event) => {
                setValor(event.target.value)
                setErro('')
              }}
              aria-invalid={Boolean(erro)}
            />
            {erro && <p className="text-sm text-destructive">{erro}</p>}
            {valorNumerico > 0 && (
              <div>
                <p className="text-sm">
                  {formatadorMoeda.format(valorNumerico)} ÷ {solicitacao.quantidadeNecessaria} ={' '}
                  {formatadorMoeda.format(unitario)} por unidade
                </p>
                <p className="text-xs text-muted-foreground">Este será o novo custo unitário da peça.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Confirmar recebimento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
