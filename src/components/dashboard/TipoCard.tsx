import { formatarPercentual } from '@/components/dashboard/formatos'
import { useContagemPorTipo } from '@/components/dashboard/queries'
import { Rosca } from '@/components/dashboard/Rosca'
import { Bolinha, CardShell, Esqueleto, EstadoCarregando, EstadoErro } from '@/components/dashboard/ui'

const COR_CORRETIVA = '#FB923C'
const COR_PREVENTIVA = '#60A5FA'

export function TipoCard({ className }: { className?: string }) {
  const query = useContagemPorTipo()

  return (
    <CardShell titulo="Preventiva x corretiva" subtitulo="Todas as manutenções registradas (inclui canceladas)" className={className}>
      {query.isPending ? (
        <EstadoCarregando rotulo="Carregando manutenções por tipo">
          <div className="@container"><div className="flex flex-col items-center gap-4 @md:flex-row">
            <Esqueleto className="size-[168px] shrink-0 rounded-full" />
            <div className="w-full space-y-3">
              <Esqueleto className="h-4 w-full" />
              <Esqueleto className="h-4 w-3/4" />
            </div>
          </div></div>
        </EstadoCarregando>
      ) : query.isError || !query.contagens ? (
        <EstadoErro erro={query.error} fallback="Não foi possível carregar as manutenções por tipo." aoTentarNovamente={() => void query.refetch()} />
      ) : (
        <Conteudo corretivas={query.contagens.CORRETIVA} preventivas={query.contagens.PREVENTIVA} />
      )}
    </CardShell>
  )
}

function Conteudo({ corretivas, preventivas }: { corretivas: number; preventivas: number }) {
  const total = corretivas + preventivas
  if (total === 0) return <p className="py-6 text-center text-sm text-muted-foreground">Sem manutenções</p>

  const pctCorretivas = (corretivas / total) * 100
  const pctPreventivas = (preventivas / total) * 100
  const linhas = [
    { chave: 'Corretivas', valor: corretivas, pct: pctCorretivas, cor: COR_CORRETIVA },
    { chave: 'Preventivas', valor: preventivas, pct: pctPreventivas, cor: COR_PREVENTIVA },
  ]

  return (
    <div className="@container"><div className="flex flex-col items-center gap-5 @md:flex-row @md:items-center">
      <Rosca
        fatias={linhas}
        centro={formatarPercentual(pctCorretivas, 0)}
        legendaCentro="corretivas"
        rotulo={`Manutenções por tipo: ${corretivas} corretivas (${formatarPercentual(pctCorretivas, 0)}) e ${preventivas} preventivas (${formatarPercentual(pctPreventivas, 0)}), total ${total}.`}
      />
      <ul className="w-full min-w-0 space-y-3">
        {linhas.map((l) => (
          <li key={l.chave} className="flex items-center gap-2 text-sm">
            <Bolinha cor={l.cor} />
            <span className="min-w-0 flex-1 truncate text-foreground" title={l.chave}>{l.chave}</span>
            <span className="shrink-0 text-muted-foreground">
              {l.valor} · {formatarPercentual(l.pct, 0)}
            </span>
          </li>
        ))}
      </ul>
    </div></div>
  )
}
