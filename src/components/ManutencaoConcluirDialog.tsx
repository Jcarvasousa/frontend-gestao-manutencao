import { useEffect, useState } from 'react'
import axios from 'axios'
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
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { mensagemDeErro } from '@/lib/erros'
import { invalidarDadosDeManutencao } from '@/lib/manutencaoQueries'
import type { Manutencao, ManutencaoConcluirPayload } from '@/types/Manutencao'

interface ManutencaoConcluirDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  manutencao: Manutencao | null
}

interface ConcluirFormValues {
  descricaoServico: string
  maquinaLiberadaParaUso: '' | 'sim' | 'nao'
  condicoesSeguranca: string
}

type FieldErrors = Partial<Record<keyof ConcluirFormValues, string>>

function valoresIniciais(): ConcluirFormValues {
  return {
    descricaoServico: '',
    maquinaLiberadaParaUso: '',
    condicoesSeguranca: '',
  }
}

const ERRO_PADRAO = 'Não foi possível concluir a manutenção. Tente novamente.'

function mensagemDeConclusao(error: unknown): string {
  const mensagem = mensagemDeErro(error, ERRO_PADRAO)
  // O backend responde 409 quando não há técnico nem serviço de terceiro vinculado.
  if (axios.isAxiosError(error) && error.response?.status === 409 && /respons[aá]vel|t[eé]cnico|terceiro/i.test(mensagem)) {
    return `${mensagem} Vincule um técnico ou um serviço de terceiro na seção de Detalhes da manutenção e tente concluir novamente.`
  }
  return mensagem
}

export function ManutencaoConcluirDialog({ open, onOpenChange, manutencao }: ManutencaoConcluirDialogProps) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<ConcluirFormValues>(() => valoresIniciais())
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const mutation = useMutation({
    mutationFn: async (formValues: ConcluirFormValues) => {
      if (!manutencao) return

      const payload: ManutencaoConcluirPayload = {
        descricaoServico: formValues.descricaoServico.trim(),
        maquinaLiberadaParaUso: formValues.maquinaLiberadaParaUso === 'sim',
        condicoesSeguranca: formValues.condicoesSeguranca.trim(),
      }

      return concluirManutencao(manutencao.id, payload)
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
  }, [open, manutencao, resetMutation])

  function handleChange<Field extends keyof ConcluirFormValues>(field: Field, value: ConcluirFormValues[Field]) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }))
    setFieldErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors: FieldErrors = {}

    if (!values.descricaoServico.trim()) errors.descricaoServico = 'Informe a descrição do serviço.'
    if (!values.maquinaLiberadaParaUso) errors.maquinaLiberadaParaUso = 'Informe se a máquina está liberada para uso.'
    if (!values.condicoesSeguranca.trim()) errors.condicoesSeguranca = 'Informe as condições de segurança.'

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

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
            {mensagemDeConclusao(mutation.error)}
          </p>
        )}

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="concluir-descricao">Descrição do serviço</Label>
            <Textarea
              id="concluir-descricao"
              value={values.descricaoServico}
              onChange={(event) => handleChange('descricaoServico', event.target.value)}
              aria-invalid={Boolean(fieldErrors.descricaoServico)}
            />
            {fieldErrors.descricaoServico && (
              <p className="text-sm text-destructive">{fieldErrors.descricaoServico}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="concluir-liberada">Máquina liberada para uso?</Label>
            <Select
              id="concluir-liberada"
              placeholder="Selecione..."
              value={values.maquinaLiberadaParaUso}
              onChange={(event) =>
                handleChange('maquinaLiberadaParaUso', event.target.value as ConcluirFormValues['maquinaLiberadaParaUso'])
              }
              aria-invalid={Boolean(fieldErrors.maquinaLiberadaParaUso)}
            >
              <option value="sim">Sim</option>
              <option value="nao">Não</option>
            </Select>
            {fieldErrors.maquinaLiberadaParaUso && (
              <p className="text-sm text-destructive">{fieldErrors.maquinaLiberadaParaUso}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="concluir-seguranca">Condições de segurança (NR12)</Label>
            <Textarea
              id="concluir-seguranca"
              value={values.condicoesSeguranca}
              onChange={(event) => handleChange('condicoesSeguranca', event.target.value)}
              placeholder="Descreva as condições de segurança verificadas (bloqueio/etiquetagem, EPIs, proteções, etc.)"
              aria-invalid={Boolean(fieldErrors.condicoesSeguranca)}
            />
            {fieldErrors.condicoesSeguranca && (
              <p className="text-sm text-destructive">{fieldErrors.condicoesSeguranca}</p>
            )}
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
