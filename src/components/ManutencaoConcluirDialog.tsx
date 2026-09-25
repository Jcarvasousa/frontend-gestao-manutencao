import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { concluirManutencao } from '@/api/manutencoes'
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
import { Textarea } from '@/components/ui/textarea'
import type { Manutencao, ManutencaoConcluirPayload } from '@/types/Manutencao'

interface ManutencaoConcluirDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  manutencao: Manutencao | null
}

interface ConcluirFormValues {
  descricaoServico: string
  custoMaoDeObra: string
}

function valoresIniciais(): ConcluirFormValues {
  return {
    descricaoServico: '',
    custoMaoDeObra: '',
  }
}

export function ManutencaoConcluirDialog({ open, onOpenChange, manutencao }: ManutencaoConcluirDialogProps) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<ConcluirFormValues>(() => valoresIniciais())

  useEffect(() => {
    if (open) {
      setValues(valoresIniciais())
    }
  }, [open, manutencao])

  const mutation = useMutation({
    mutationFn: async (formValues: ConcluirFormValues) => {
      if (!manutencao) return

      const payload: ManutencaoConcluirPayload = {
        descricaoServico: formValues.descricaoServico.trim() || null,
        custoMaoDeObra: formValues.custoMaoDeObra.trim() ? Number(formValues.custoMaoDeObra) : null,
      }

      return concluirManutencao(manutencao.id, payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['manutencoes'] })
      onOpenChange(false)
    },
  })

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    mutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Concluir manutenção</DialogTitle>
          <DialogDescription>
            {manutencao ? `Máquina ${manutencao.maquinaCodigo} — ${manutencao.problemaDescricao}` : ''}
          </DialogDescription>
        </DialogHeader>

        {mutation.isError && (
          <p className="text-sm text-destructive" role="alert">
            Não foi possível concluir a manutenção. Tente novamente.
          </p>
        )}

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="concluir-descricao">Descrição do serviço</Label>
            <Textarea
              id="concluir-descricao"
              value={values.descricaoServico}
              onChange={(event) => setValues((current) => ({ ...current, descricaoServico: event.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="concluir-custo">Custo de mão de obra</Label>
            <Input
              id="concluir-custo"
              type="number"
              min="0"
              step="0.01"
              value={values.custoMaoDeObra}
              onChange={(event) => setValues((current) => ({ ...current, custoMaoDeObra: event.target.value }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending || !manutencao}>
              {mutation.isPending ? 'Concluindo...' : 'Concluir'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
