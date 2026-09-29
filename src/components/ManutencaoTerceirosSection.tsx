import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buscarServicosTerceiros, criarServicoTerceiro, removerServicoTerceiro } from '@/api/manutencoes'
import { ConfirmarDialog } from '@/components/ConfirmarDialog'
import { ServicoTerceiroEdicaoDialog } from '@/components/ServicoTerceiroEdicaoDialog'
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
import { currencyFormatter, horasFormatter } from '@/lib/formatadores'
import { invalidarDadosDeManutencao, manutencaoKeys } from '@/lib/manutencaoQueries'
import type { ServicoTerceiro, ServicoTerceiroPayload } from '@/types/Manutencao'

interface ManutencaoTerceirosSectionProps {
  manutencaoId: number
  editavel: boolean
  // Em CONCLUIDA só o valor final e a observação do terceiro podem ser alterados.
  edicaoValorPermitida: boolean
}

type ModoValor = 'total' | 'horas'

interface TerceiroFormValues {
  descricao: string
  fornecedor: string
  modo: ModoValor
  valorApurado: string
  horasTrabalhadas: string
  valorHora: string
}

type FieldErrors = Partial<Record<'descricao' | 'valorApurado' | 'horasTrabalhadas' | 'valorHora', string>>

const MODO_OPTIONS: { value: ModoValor; label: string }[] = [
  { value: 'total', label: 'Valor total' },
  { value: 'horas', label: 'Horas × valor/hora' },
]

function valoresIniciais(): TerceiroFormValues {
  return {
    descricao: '',
    fornecedor: '',
    modo: 'total',
    valorApurado: '',
    horasTrabalhadas: '',
    valorHora: '',
  }
}

function valorEfetivo(servico: ServicoTerceiro): { valor: number | null; origem: 'final' | 'apurado' } {
  if (servico.valorFinal != null) return { valor: servico.valorFinal, origem: 'final' }
  return { valor: servico.valorApurado, origem: 'apurado' }
}

export function ManutencaoTerceirosSection({
  manutencaoId,
  editavel,
  edicaoValorPermitida,
}: ManutencaoTerceirosSectionProps) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<TerceiroFormValues>(() => valoresIniciais())
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [servicoARemover, setServicoARemover] = useState<ServicoTerceiro | null>(null)
  const [servicoEmEdicao, setServicoEmEdicao] = useState<ServicoTerceiro | null>(null)

  const query = useQuery({
    queryKey: manutencaoKeys.terceiros(manutencaoId),
    queryFn: () => buscarServicosTerceiros(manutencaoId),
  })

  const mutation = useMutation({
    mutationFn: async (formValues: TerceiroFormValues) => {
      // Nunca enviar os dois modos juntos: o backend responde 400 se misturar.
      const payload: ServicoTerceiroPayload = {
        manutencaoId,
        descricao: formValues.descricao.trim(),
        fornecedor: formValues.fornecedor.trim() || null,
        ...(formValues.modo === 'total'
          ? { valorApurado: Number(formValues.valorApurado) }
          : {
              horasTrabalhadas: Number(formValues.horasTrabalhadas),
              valorHora: Number(formValues.valorHora),
            }),
      }

      return criarServicoTerceiro(payload)
    },
    onSuccess: async () => {
      setValues(valoresIniciais())
      setFieldErrors({})
      await invalidarDadosDeManutencao(queryClient)
    },
  })

  const remocao = useMutation({
    mutationFn: async (servico: ServicoTerceiro) => removerServicoTerceiro(servico.id),
    onSuccess: async () => {
      await invalidarDadosDeManutencao(queryClient)
      setServicoARemover(null)
    },
  })

  const { reset: resetMutation } = mutation
  const { reset: resetRemocao } = remocao

  useEffect(() => {
    setValues(valoresIniciais())
    setFieldErrors({})
    resetMutation()
  }, [manutencaoId, resetMutation])

  useEffect(() => {
    if (servicoARemover) resetRemocao()
  }, [servicoARemover, resetRemocao])

  function handleChange<Field extends keyof TerceiroFormValues>(field: Field, value: TerceiroFormValues[Field]) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }))
    setFieldErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors: FieldErrors = {}

    if (!values.descricao.trim()) errors.descricao = 'Informe a descrição do serviço.'

    if (values.modo === 'total') {
      const valor = Number(values.valorApurado)
      if (values.valorApurado === '' || !Number.isFinite(valor) || valor < 0) {
        errors.valorApurado = 'Informe um valor de 0 ou mais.'
      }
    } else {
      const horas = Number(values.horasTrabalhadas)
      const valorHora = Number(values.valorHora)
      if (values.horasTrabalhadas === '' || !Number.isFinite(horas) || horas <= 0) {
        errors.horasTrabalhadas = 'Informe as horas (maior que 0).'
      }
      if (values.valorHora === '' || !Number.isFinite(valorHora) || valorHora < 0) {
        errors.valorHora = 'Informe um valor/hora de 0 ou mais.'
      }
    }

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    mutation.mutate(values)
  }

  const servicos = query.data ?? []
  const totalCusto = servicos.reduce((total, item) => total + (valorEfetivo(item).valor ?? 0), 0)

  const horasPrevia = Number(values.horasTrabalhadas)
  const valorHoraPrevia = Number(values.valorHora)
  const previaValida =
    values.horasTrabalhadas !== '' &&
    values.valorHora !== '' &&
    Number.isFinite(horasPrevia) &&
    Number.isFinite(valorHoraPrevia)

  return (
    <section className="grid gap-3" aria-labelledby="detalhes-terceiros-titulo">
      <h3 id="detalhes-terceiros-titulo" className="text-base font-semibold">
        Serviços de terceiros
      </h3>

      <div className="overflow-hidden rounded-lg border">
        {query.isPending ? (
          <p className="p-4 text-sm text-muted-foreground">Carregando...</p>
        ) : query.isError ? (
          <p className="p-4 text-sm text-destructive">
            {mensagemDeErro(query.error, 'Não foi possível carregar os serviços de terceiros.')}
          </p>
        ) : servicos.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Nenhum serviço de terceiro registrado</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Observação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicos.map((servico) => {
                const { valor, origem } = valorEfetivo(servico)

                return (
                  <TableRow key={servico.id}>
                    <TableCell className="font-medium">{servico.descricao}</TableCell>
                    <TableCell>{servico.fornecedor ?? '—'}</TableCell>
                    <TableCell>
                      <span className="block">{valor != null ? currencyFormatter.format(valor) : '—'}</span>
                      <span className="block text-xs text-muted-foreground">
                        {origem === 'final' ? 'valor final' : 'valor apurado'}
                        {origem === 'apurado' && servico.horasTrabalhadas != null && servico.valorHora != null
                          ? ` (${horasFormatter.format(servico.horasTrabalhadas)} h × ${currencyFormatter.format(servico.valorHora)})`
                          : ''}
                      </span>
                    </TableCell>
                    <TableCell>{servico.observacao ?? '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!edicaoValorPermitida}
                          onClick={() => setServicoEmEdicao(servico)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!editavel}
                          onClick={() => setServicoARemover(servico)}
                        >
                          Remover
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              <TableRow>
                <TableCell colSpan={2} className="text-right font-medium">
                  Total de terceiros
                </TableCell>
                <TableCell className="font-semibold">{currencyFormatter.format(totalCusto)}</TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableBody>
          </Table>
        )}
      </div>

      {editavel && (
        <form className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2" onSubmit={handleSubmit}>
          <p className="text-sm font-medium sm:col-span-2">Novo serviço de terceiro</p>

          {mutation.isError && (
            <p className="text-sm text-destructive sm:col-span-2" role="alert">
              {mensagemDeErro(mutation.error, 'Não foi possível registrar o serviço de terceiro. Tente novamente.')}
            </p>
          )}

          <div className="grid gap-2">
            <Label htmlFor="terceiro-descricao">Descrição</Label>
            <Input
              id="terceiro-descricao"
              value={values.descricao}
              onChange={(event) => handleChange('descricao', event.target.value)}
              aria-invalid={Boolean(fieldErrors.descricao)}
            />
            {fieldErrors.descricao && <p className="text-sm text-destructive">{fieldErrors.descricao}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="terceiro-fornecedor">Fornecedor</Label>
            <Input
              id="terceiro-fornecedor"
              value={values.fornecedor}
              onChange={(event) => handleChange('fornecedor', event.target.value)}
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="terceiro-modo">Forma de cobrança</Label>
            <select
              id="terceiro-modo"
              value={values.modo}
              onChange={(event) => {
                const modo: ModoValor = event.target.value === 'horas' ? 'horas' : 'total'
                handleChange('modo', modo)
                setFieldErrors((currentErrors) => ({
                  ...currentErrors,
                  valorApurado: undefined,
                  horasTrabalhadas: undefined,
                  valorHora: undefined,
                }))
              }}
              className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            >
              {MODO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {values.modo === 'total' ? (
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="terceiro-valor-apurado">Valor total (R$)</Label>
              <Input
                id="terceiro-valor-apurado"
                type="number"
                min="0"
                step="0.01"
                value={values.valorApurado}
                onChange={(event) => handleChange('valorApurado', event.target.value)}
                aria-invalid={Boolean(fieldErrors.valorApurado)}
              />
              {fieldErrors.valorApurado && <p className="text-sm text-destructive">{fieldErrors.valorApurado}</p>}
            </div>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="terceiro-horas">Horas trabalhadas</Label>
                <Input
                  id="terceiro-horas"
                  type="number"
                  min="0"
                  step="0.25"
                  value={values.horasTrabalhadas}
                  onChange={(event) => handleChange('horasTrabalhadas', event.target.value)}
                  aria-invalid={Boolean(fieldErrors.horasTrabalhadas)}
                />
                {fieldErrors.horasTrabalhadas && (
                  <p className="text-sm text-destructive">{fieldErrors.horasTrabalhadas}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="terceiro-valor-hora">Valor por hora (R$)</Label>
                <Input
                  id="terceiro-valor-hora"
                  type="number"
                  min="0"
                  step="0.01"
                  value={values.valorHora}
                  onChange={(event) => handleChange('valorHora', event.target.value)}
                  aria-invalid={Boolean(fieldErrors.valorHora)}
                />
                {fieldErrors.valorHora && <p className="text-sm text-destructive">{fieldErrors.valorHora}</p>}
              </div>
              {previaValida && (
                <p className="text-sm text-muted-foreground sm:col-span-2">
                  Prévia: {horasFormatter.format(horasPrevia)} h × {currencyFormatter.format(valorHoraPrevia)} ={' '}
                  {currencyFormatter.format(horasPrevia * valorHoraPrevia)} (o valor oficial é calculado pelo servidor)
                </p>
              )}
            </>
          )}

          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Registrando...' : 'Registrar terceiro'}
            </Button>
          </div>
        </form>
      )}

      <ServicoTerceiroEdicaoDialog
        open={Boolean(servicoEmEdicao)}
        onOpenChange={(open) => {
          if (!open) setServicoEmEdicao(null)
        }}
        servico={servicoEmEdicao}
      />

      <ConfirmarDialog
        open={Boolean(servicoARemover)}
        onOpenChange={(open) => {
          if (!open) setServicoARemover(null)
        }}
        titulo="Remover serviço de terceiro"
        descricao={
          servicoARemover
            ? `Remover o serviço "${servicoARemover.descricao}" desta manutenção? O valor deixará de compor o custo.`
            : ''
        }
        rotuloConfirmar="Remover"
        rotuloPendente="Removendo..."
        pendente={remocao.isPending}
        erro={
          remocao.isError
            ? mensagemDeErro(remocao.error, 'Não foi possível remover o serviço de terceiro. Tente novamente.')
            : null
        }
        onConfirmar={() => {
          if (servicoARemover) remocao.mutate(servicoARemover)
        }}
      />
    </section>
  )
}
