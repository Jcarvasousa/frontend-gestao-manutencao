import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buscarManutencao, cancelarManutencao, iniciarManutencao } from '@/api/manutencoes'
import { ConfirmarDialog } from '@/components/ConfirmarDialog'
import { ManutencaoConcluirDialog } from '@/components/ManutencaoConcluirDialog'
import { ManutencaoPecasSection } from '@/components/ManutencaoPecasSection'
import { ManutencaoTecnicosSection } from '@/components/ManutencaoTecnicosSection'
import { ManutencaoTerceirosSection } from '@/components/ManutencaoTerceirosSection'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { mensagemDeErro } from '@/lib/erros'
import { invalidarDadosDeManutencao, manutencaoKeys } from '@/lib/manutencaoQueries'
import { manutencaoAceitaAlteracoes, STATUS_MANUTENCAO_LABELS } from '@/types/Manutencao'

interface ManutencaoDetalhesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  manutencaoId: number | null
}

export function ManutencaoDetalhesDialog({ open, onOpenChange, manutencaoId }: ManutencaoDetalhesDialogProps) {
  const queryClient = useQueryClient()
  const [isConcluirOpen, setIsConcluirOpen] = useState(false)
  const [isCancelarOpen, setIsCancelarOpen] = useState(false)

  const query = useQuery({
    queryKey: manutencaoKeys.detalhe(manutencaoId ?? 0),
    queryFn: () => buscarManutencao(manutencaoId ?? 0),
    enabled: open && manutencaoId != null,
  })

  const iniciar = useMutation({
    mutationFn: async (id: number) => iniciarManutencao(id),
    onSuccess: async () => {
      await invalidarDadosDeManutencao(queryClient)
    },
  })

  const cancelar = useMutation({
    mutationFn: async (id: number) => cancelarManutencao(id),
    onSuccess: async () => {
      await invalidarDadosDeManutencao(queryClient)
      setIsCancelarOpen(false)
    },
  })

  const { reset: resetIniciar } = iniciar
  const { reset: resetCancelar } = cancelar

  useEffect(() => {
    if (open) {
      setIsConcluirOpen(false)
      setIsCancelarOpen(false)
      resetIniciar()
      resetCancelar()
    }
  }, [open, manutencaoId, resetIniciar, resetCancelar])

  useEffect(() => {
    if (isCancelarOpen) resetCancelar()
  }, [isCancelarOpen, resetCancelar])

  const manutencao = query.data
  const editavel = manutencao ? manutencaoAceitaAlteracoes(manutencao.status) : false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Detalhes da manutenção</DialogTitle>
          <DialogDescription>
            {manutencao
              ? `Máquina ${manutencao.maquinaCodigo} — ${manutencao.problemaDescricao}`
              : 'Peças, técnicos e serviços de terceiros desta manutenção.'}
          </DialogDescription>
        </DialogHeader>

        {query.isPending ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : query.isError ? (
          <p className="text-sm text-destructive" role="alert">
            {mensagemDeErro(query.error, 'Não foi possível carregar a manutenção.')}
          </p>
        ) : (
          <div className="grid gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm">
                <span className="text-muted-foreground">Status: </span>
                <span className="font-medium">{STATUS_MANUTENCAO_LABELS[query.data.status]}</span>
              </p>

              {editavel && (
                <div className="flex flex-wrap items-center gap-2">
                  {query.data.status === 'ABERTA' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={iniciar.isPending}
                      onClick={() => iniciar.mutate(query.data.id)}
                    >
                      {iniciar.isPending ? 'Iniciando...' : 'Iniciar'}
                    </Button>
                  )}
                  <Button size="sm" onClick={() => setIsConcluirOpen(true)}>
                    Concluir
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setIsCancelarOpen(true)}>
                    Cancelar manutenção
                  </Button>
                </div>
              )}
            </div>

            {iniciar.isError && (
              <p className="text-sm text-destructive" role="alert">
                {mensagemDeErro(iniciar.error, 'Não foi possível iniciar a manutenção. Tente novamente.')}
              </p>
            )}

            {query.data.status === 'CANCELADA' && (
              <p className="text-sm text-muted-foreground">
                Manutenção cancelada: os dados abaixo são somente leitura.
              </p>
            )}
            {query.data.status === 'CONCLUIDA' && (
              <p className="text-sm text-muted-foreground">
                Manutenção concluída: apenas o valor final e a observação dos serviços de terceiros podem ser editados.
              </p>
            )}

            <ManutencaoPecasSection manutencaoId={query.data.id} editavel={editavel} />
            <ManutencaoTecnicosSection manutencaoId={query.data.id} editavel={editavel} />
            <ManutencaoTerceirosSection
              manutencaoId={query.data.id}
              editavel={editavel}
              edicaoValorPermitida={query.data.status !== 'CANCELADA'}
            />
          </div>
        )}

        <ManutencaoConcluirDialog
          open={isConcluirOpen}
          onOpenChange={setIsConcluirOpen}
          manutencao={query.data ?? null}
        />

        <ConfirmarDialog
          open={isCancelarOpen}
          onOpenChange={setIsCancelarOpen}
          titulo="Cancelar manutenção"
          descricao="Cancelar esta manutenção? As peças utilizadas serão devolvidas ao estoque e não será mais possível alterá-la. Esta ação não pode ser desfeita."
          rotuloConfirmar="Cancelar manutenção"
          rotuloPendente="Cancelando..."
          rotuloVoltar="Voltar"
          pendente={cancelar.isPending}
          erro={cancelar.isError ? mensagemDeErro(cancelar.error, 'Não foi possível cancelar a manutenção. Tente novamente.') : null}
          onConfirmar={() => {
            if (manutencaoId != null) cancelar.mutate(manutencaoId)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
