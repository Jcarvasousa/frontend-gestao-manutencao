import type { StatusManutencao } from '@/types/Manutencao'
import { STATUS_ORDEM, useContagemPorStatus } from '@/components/dashboard/queries'
import { Bolinha, CardShell, Esqueleto, EstadoCarregando, EstadoErro } from '@/components/dashboard/ui'

const STATUS_INFO: Record<StatusManutencao, { rotulo: string; cor: string }> = {
  ABERTA: { rotulo: 'Abertas', cor: '#60A5FA' },
  EM_ANDAMENTO: { rotulo: 'Em andamento', cor: '#FBBF24' },
  AGUARDANDO_PECA: { rotulo: 'Aguardando peça', cor: '#A78BFA' },
  CONCLUIDA: { rotulo: 'Concluídas', cor: '#4ADE80' },
  CANCELADA: { rotulo: 'Canceladas', cor: '#94A3B8' },
}

export function StatusCard() {
  const status = useContagemPorStatus()

  return (
    <CardShell titulo="Manutenções por status" linkTexto="Ver manutenções" linkPara="/manutencoes" className="md:col-span-2 lg:col-span-12">
      {status.isPending ? (
        <EstadoCarregando rotulo="Carregando manutenções por status">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {STATUS_ORDEM.map((s) => (
              <Esqueleto key={s} className="h-12" />
            ))}
          </div>
          <Esqueleto className="mt-4 h-2.5 w-full" />
        </EstadoCarregando>
      ) : status.isError || !status.contagens ? (
        <EstadoErro
          erro={status.error}
          fallback="Não foi possível carregar as manutenções por status."
          aoTentarNovamente={() => void status.refetch()}
        />
      ) : (
        <StatusConteudo contagens={status.contagens} />
      )}
    </CardShell>
  )
}

function StatusConteudo({ contagens }: { contagens: Record<StatusManutencao, number> }) {
  const total = STATUS_ORDEM.reduce((soma, s) => soma + contagens[s], 0)
  const resumo = STATUS_ORDEM.map((s) => `${contagens[s]} ${STATUS_INFO[s].rotulo.toLocaleLowerCase('pt-BR')}`).join(', ')

  return (
    <>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-5">
        {STATUS_ORDEM.map((s) => (
          <li key={s} className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Bolinha cor={STATUS_INFO[s].cor} />
              <span className="truncate">{STATUS_INFO[s].rotulo}</span>
            </div>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{contagens[s]}</p>
          </li>
        ))}
      </ul>
      {total > 0 ? (
        <div
          className="mt-4 flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full"
          role="img"
          aria-label={`Manutenções por status: ${resumo}. Total ${total}.`}
        >
          {STATUS_ORDEM.filter((s) => contagens[s] > 0).map((s) => (
            <div key={s} style={{ flexGrow: contagens[s], backgroundColor: STATUS_INFO[s].cor }} className="min-w-[4px] basis-0" />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">Nenhuma manutenção registrada</p>
      )}
    </>
  )
}
