import { currencyFormatter } from '@/lib/formatadores'
import { formatarMoedaInteira, formatarPercentual, mesPorExtenso } from '@/components/dashboard/formatos'
import { useCustoSetores } from '@/components/dashboard/queries'
import { Rosca, type FatiaRosca } from '@/components/dashboard/Rosca'
import { Bolinha, CardShell, Esqueleto, EstadoCarregando, EstadoErro } from '@/components/dashboard/ui'

const PALETA = ['#2DD4BF', '#60A5FA', '#FBBF24', '#A78BFA', '#94A3B8']
const COR_SEM_SETOR = '#64748B'

export function SetoresCard({ mes, ano, className }: { mes: number; ano: number; className?: string }) {
  const query = useCustoSetores(mes, ano)

  return (
    <CardShell titulo="Custo por setor" subtitulo={`Participação no custo de ${mesPorExtenso(mes)}/${ano}`} className={className}>
      {query.isPending ? (
        <EstadoCarregando rotulo="Carregando custo por setor (pode demorar)">
          <div className="@container"><div className="flex flex-col items-center gap-4 @md:flex-row">
            <Esqueleto className="size-[168px] shrink-0 rounded-full" />
            <div className="w-full space-y-3">
              <Esqueleto className="h-4 w-full" />
              <Esqueleto className="h-4 w-5/6" />
              <Esqueleto className="h-4 w-2/3" />
            </div>
          </div></div>
          <p className="mt-3 text-xs text-muted-foreground">Este cálculo é mais lento que os demais…</p>
        </EstadoCarregando>
      ) : query.isError ? (
        <EstadoErro erro={query.error} fallback="Não foi possível carregar o custo por setor." aoTentarNovamente={() => void query.refetch()} />
      ) : query.data.totalGeral <= 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Sem custos no mês</p>
      ) : (
        <Conteudo dados={query.data} />
      )}
    </CardShell>
  )
}

function Conteudo({ dados }: { dados: NonNullable<ReturnType<typeof useCustoSetores>['data']> }) {
  const ordenados = [...dados.setores].sort((a, b) => b.custoTotal - a.custoTotal)
  let proximaCor = 0
  const itens = ordenados.map((setor) => {
    const cor = setor.setorId === null ? COR_SEM_SETOR : PALETA[proximaCor++ % PALETA.length]
    return { setor, cor }
  })
  const fatias: FatiaRosca[] = itens.map(({ setor, cor }) => ({ chave: setor.setorNome, valor: setor.custoTotal, cor }))
  const resumo = itens
    .map(({ setor }) => `${setor.setorNome} ${currencyFormatter.format(setor.custoTotal)} (${formatarPercentual(setor.percentualDoTotal, 2)})`)
    .join('; ')

  return (
    <div className="@container"><div className="flex flex-col items-center gap-5 @md:flex-row @md:items-center">
      <Rosca
        fatias={fatias}
        centro={formatarMoedaInteira(dados.totalGeral)}
        legendaCentro="custo do mês"
        rotulo={`Custo por setor no mês, total ${formatarMoedaInteira(dados.totalGeral)}: ${resumo}.`}
      />
      <ul className="max-h-56 w-full min-w-0 space-y-2.5 overflow-y-auto pr-1" tabIndex={0} aria-label="Legenda do custo por setor">
        {itens.map(({ setor, cor }) => (
          <li key={setor.setorId ?? 'sem-setor'} className="flex items-center gap-2 text-xs">
            <Bolinha cor={cor} />
            <span className="min-w-0 flex-1 truncate text-foreground" title={setor.setorNome}>{setor.setorNome}</span>
            <span className="shrink-0 text-muted-foreground">
              {currencyFormatter.format(setor.custoTotal)} · {formatarPercentual(setor.percentualDoTotal, 2)}
            </span>
          </li>
        ))}
      </ul>
    </div></div>
  )
}
