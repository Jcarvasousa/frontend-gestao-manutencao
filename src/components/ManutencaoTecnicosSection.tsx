import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buscarTecnicosDaManutencao, removerTecnico, vincularTecnico } from '@/api/manutencoes'
import { ConfirmarDialog } from '@/components/ConfirmarDialog'
import { TecnicoSelect } from '@/components/TecnicoSelect'
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
import type { ManutencaoTecnico, ManutencaoTecnicoPayload } from '@/types/Manutencao'

interface ManutencaoTecnicosSectionProps {
  manutencaoId: number
  editavel: boolean
}

interface VinculoFormValues {
  tecnicoId: string
  horasTrabalhadas: string
}

type FieldErrors = Partial<Record<keyof VinculoFormValues, string>>

function valoresIniciais(): VinculoFormValues {
  return {
    tecnicoId: '',
    horasTrabalhadas: '',
  }
}

export function ManutencaoTecnicosSection({ manutencaoId, editavel }: ManutencaoTecnicosSectionProps) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<VinculoFormValues>(() => valoresIniciais())
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [vinculoARemover, setVinculoARemover] = useState<ManutencaoTecnico | null>(null)

  const query = useQuery({
    queryKey: manutencaoKeys.tecnicos(manutencaoId),
    queryFn: () => buscarTecnicosDaManutencao(manutencaoId),
  })

  const mutation = useMutation({
    mutationFn: async (formValues: VinculoFormValues) => {
      const payload: ManutencaoTecnicoPayload = {
        tecnicoId: Number(formValues.tecnicoId),
        horasTrabalhadas: Number(formValues.horasTrabalhadas),
      }

      return vincularTecnico(manutencaoId, payload)
    },
    onSuccess: async () => {
      setValues(valoresIniciais())
      setFieldErrors({})
      await invalidarDadosDeManutencao(queryClient)
    },
  })

  const remocao = useMutation({
    mutationFn: async (vinculo: ManutencaoTecnico) => removerTecnico(manutencaoId, vinculo.id),
    onSuccess: async () => {
      await invalidarDadosDeManutencao(queryClient)
      setVinculoARemover(null)
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
    if (vinculoARemover) resetRemocao()
  }, [vinculoARemover, resetRemocao])

  function handleChange<Field extends keyof VinculoFormValues>(field: Field, value: VinculoFormValues[Field]) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }))
    setFieldErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors: FieldErrors = {}
    const horas = Number(values.horasTrabalhadas)

    if (!values.tecnicoId) errors.tecnicoId = 'Selecione o técnico.'
    if (values.horasTrabalhadas === '' || !Number.isFinite(horas) || horas <= 0) {
      errors.horasTrabalhadas = 'Informe as horas trabalhadas (maior que 0).'
    }

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    mutation.mutate(values)
  }

  const vinculos = query.data ?? []
  const totalCusto = vinculos.reduce((total, item) => total + item.custoTotal, 0)

  return (
    <section className="grid gap-3" aria-labelledby="detalhes-tecnicos-titulo">
      <h3 id="detalhes-tecnicos-titulo" className="text-base font-semibold">
        Técnicos
      </h3>

      <div className="overflow-hidden rounded-lg border">
        {query.isPending ? (
          <p className="p-4 text-sm text-slate-500">Carregando...</p>
        ) : query.isError ? (
          <p className="p-4 text-sm text-destructive">
            {mensagemDeErro(query.error, 'Não foi possível carregar os técnicos.')}
          </p>
        ) : vinculos.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Nenhum técnico vinculado</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Técnico</TableHead>
                <TableHead>Horas</TableHead>
                <TableHead>Custo/hora</TableHead>
                <TableHead>Custo total</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vinculos.map((vinculo) => (
                <TableRow key={vinculo.id}>
                  <TableCell className="font-medium">{vinculo.tecnicoNome}</TableCell>
                  <TableCell>{horasFormatter.format(vinculo.horasTrabalhadas)} h</TableCell>
                  <TableCell>{currencyFormatter.format(vinculo.custoPorHora)}</TableCell>
                  <TableCell>{currencyFormatter.format(vinculo.custoTotal)}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!editavel}
                      onClick={() => setVinculoARemover(vinculo)}
                    >
                      Remover
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="text-right font-medium">
                  Total de mão de obra
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
          <p className="text-sm font-medium sm:col-span-2">Vincular técnico</p>

          {mutation.isError && (
            <p className="text-sm text-destructive sm:col-span-2" role="alert">
              {mensagemDeErro(mutation.error, 'Não foi possível vincular o técnico. Tente novamente.')}
            </p>
          )}

          <div className="grid gap-2">
            <Label htmlFor="vinculo-tecnico">Técnico</Label>
            <TecnicoSelect
              id="vinculo-tecnico"
              value={values.tecnicoId}
              onChange={(tecnicoId) => handleChange('tecnicoId', tecnicoId)}
              invalid={Boolean(fieldErrors.tecnicoId)}
            />
            {fieldErrors.tecnicoId && <p className="text-sm text-destructive">{fieldErrors.tecnicoId}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="vinculo-horas">Horas trabalhadas</Label>
            <Input
              id="vinculo-horas"
              type="number"
              min="0"
              step="0.25"
              value={values.horasTrabalhadas}
              onChange={(event) => handleChange('horasTrabalhadas', event.target.value)}
              aria-invalid={Boolean(fieldErrors.horasTrabalhadas)}
            />
            {fieldErrors.horasTrabalhadas && <p className="text-sm text-destructive">{fieldErrors.horasTrabalhadas}</p>}
          </div>

          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Vinculando...' : 'Vincular técnico'}
            </Button>
          </div>
        </form>
      )}

      <ConfirmarDialog
        open={Boolean(vinculoARemover)}
        onOpenChange={(open) => {
          if (!open) setVinculoARemover(null)
        }}
        titulo="Remover técnico"
        descricao={
          vinculoARemover
            ? `Remover ${vinculoARemover.tecnicoNome} desta manutenção? As ${horasFormatter.format(vinculoARemover.horasTrabalhadas)} h deixarão de compor o custo de mão de obra.`
            : ''
        }
        rotuloConfirmar="Remover"
        rotuloPendente="Removendo..."
        pendente={remocao.isPending}
        erro={remocao.isError ? mensagemDeErro(remocao.error, 'Não foi possível remover o técnico. Tente novamente.') : null}
        onConfirmar={() => {
          if (vinculoARemover) remocao.mutate(vinculoARemover)
        }}
      />
    </section>
  )
}
