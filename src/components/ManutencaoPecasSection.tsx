import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buscarPecasUsadas } from '@/api/manutencoes'
import { registrarSaida } from '@/api/movimentacoes'
import { PecaDevolucaoDialog } from '@/components/PecaDevolucaoDialog'
import { PecaSelect } from '@/components/PecaSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mensagemDeErro } from '@/lib/erros'
import { currencyFormatter } from '@/lib/formatadores'
import { invalidarDadosDeManutencao, manutencaoKeys } from '@/lib/manutencaoQueries'
import type { PecaUsada } from '@/types/Manutencao'
import type { MovimentacaoSaidaPayload } from '@/types/MovimentacaoEstoque'
import type { Peca } from '@/types/Peca'
import { UNIDADE_MEDIDA_LABELS } from '@/types/UnidadeMedida'

interface ManutencaoPecasSectionProps {
  manutencaoId: number
  editavel: boolean
}

interface UsoFormValues {
  pecaId: string
  quantidade: string
  observacao: string
}

type FieldErrors = Partial<Record<'pecaId' | 'quantidade', string>>

function valoresIniciais(): UsoFormValues {
  return {
    pecaId: '',
    quantidade: '',
    observacao: '',
  }
}

export function ManutencaoPecasSection({ manutencaoId, editavel }: ManutencaoPecasSectionProps) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<UsoFormValues>(() => valoresIniciais())
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [pecaSelecionada, setPecaSelecionada] = useState<Peca | null>(null)
  const [pecaADevolver, setPecaADevolver] = useState<PecaUsada | null>(null)

  const query = useQuery({
    queryKey: manutencaoKeys.pecasUsadas(manutencaoId),
    queryFn: () => buscarPecasUsadas(manutencaoId),
  })

  const mutation = useMutation({
    mutationFn: async (formValues: UsoFormValues) => {
      const payload: MovimentacaoSaidaPayload = {
        pecaId: Number(formValues.pecaId),
        manutencaoId,
        quantidade: Number(formValues.quantidade),
        observacao: formValues.observacao.trim() || null,
      }

      return registrarSaida(payload)
    },
    onSuccess: async () => {
      setValues(valoresIniciais())
      setFieldErrors({})
      setPecaSelecionada(null)
      await invalidarDadosDeManutencao(queryClient)
    },
  })

  const { reset: resetMutation } = mutation

  useEffect(() => {
    setValues(valoresIniciais())
    setFieldErrors({})
    setPecaSelecionada(null)
    resetMutation()
  }, [manutencaoId, resetMutation])

  function handleChange<Field extends keyof UsoFormValues>(field: Field, value: UsoFormValues[Field]) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }))
    setFieldErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors: FieldErrors = {}
    const quantidade = Number(values.quantidade)

    if (!values.pecaId) errors.pecaId = 'Selecione a peça.'
    if (values.quantidade === '' || !Number.isInteger(quantidade) || quantidade < 1) {
      errors.quantidade = 'Informe uma quantidade inteira de 1 ou mais.'
    } else if (pecaSelecionada && quantidade > pecaSelecionada.quantidadeAtual) {
      errors.quantidade = `Saldo insuficiente: há ${pecaSelecionada.quantidadeAtual} em estoque.`
    }

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    mutation.mutate(values)
  }

  const pecasUsadas = query.data ?? []
  const totalCusto = pecasUsadas.reduce((total, item) => total + item.custoTotal, 0)

  return (
    <section className="grid gap-3" aria-labelledby="detalhes-pecas-titulo">
      <h3 id="detalhes-pecas-titulo" className="text-base font-semibold">
        Peças usadas
      </h3>

      <div className="overflow-hidden rounded-lg border">
        {query.isPending ? (
          <p className="p-4 text-sm text-slate-500">Carregando...</p>
        ) : query.isError ? (
          <p className="p-4 text-sm text-destructive">
            {mensagemDeErro(query.error, 'Não foi possível carregar as peças usadas.')}
          </p>
        ) : pecasUsadas.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Nenhuma peça usada nesta manutenção</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Custo total</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pecasUsadas.map((item) => (
                <TableRow key={item.pecaId}>
                  <TableCell className="font-medium">{item.pecaCodigo}</TableCell>
                  <TableCell>{item.pecaNome}</TableCell>
                  <TableCell>
                    {item.quantidadeUsada} {UNIDADE_MEDIDA_LABELS[item.unidadeMedida] ?? item.unidadeMedida}
                  </TableCell>
                  <TableCell>{currencyFormatter.format(item.custoTotal)}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!editavel || item.saldoDevolvivel < 1}
                      onClick={() => setPecaADevolver(item)}
                    >
                      Devolver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="text-right font-medium">
                  Total de peças
                </TableCell>
                <TableCell className="font-semibold">{currencyFormatter.format(totalCusto)}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        )}
      </div>

      {editavel && (
        <form className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2" onSubmit={handleSubmit}>
          <p className="text-sm font-medium sm:col-span-2">Registrar uso de peça</p>

          {mutation.isError && (
            <p className="text-sm text-destructive sm:col-span-2" role="alert">
              {mensagemDeErro(mutation.error, 'Não foi possível registrar o uso da peça. Tente novamente.')}
            </p>
          )}

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="uso-peca">Peça</Label>
            <PecaSelect
              id="uso-peca"
              value={values.pecaId}
              onChange={(pecaId, peca) => {
                handleChange('pecaId', pecaId)
                setPecaSelecionada(peca)
              }}
              invalid={Boolean(fieldErrors.pecaId)}
            />
            {fieldErrors.pecaId && <p className="text-sm text-destructive">{fieldErrors.pecaId}</p>}
            {pecaSelecionada && (
              <p className="text-sm text-slate-500">
                Saldo atual: {pecaSelecionada.quantidadeAtual}{' '}
                {UNIDADE_MEDIDA_LABELS[pecaSelecionada.unidadeMedida] ?? pecaSelecionada.unidadeMedida}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="uso-quantidade">Quantidade</Label>
            <Input
              id="uso-quantidade"
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
            <Label htmlFor="uso-observacao">Observação</Label>
            <Input
              id="uso-observacao"
              value={values.observacao}
              onChange={(event) => handleChange('observacao', event.target.value)}
            />
          </div>

          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Registrando...' : 'Registrar uso'}
            </Button>
          </div>
        </form>
      )}

      <PecaDevolucaoDialog
        open={Boolean(pecaADevolver)}
        onOpenChange={(open) => {
          if (!open) setPecaADevolver(null)
        }}
        manutencaoId={manutencaoId}
        pecaUsada={pecaADevolver}
      />
    </section>
  )
}
