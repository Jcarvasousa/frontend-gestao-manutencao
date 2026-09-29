import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { currencyFormatter } from '@/lib/formatadores'
import { cn } from '@/lib/utils'
import { formatarPercentual, mesPorExtenso } from '@/components/dashboard/formatos'
import { useContagemPorStatus, useCustoMensal, useKpis, useOrcamentoMensal } from '@/components/dashboard/queries'
import { Esqueleto, EstadoCarregando, EstadoErro } from '@/components/dashboard/ui'

function KpiShell({ titulo, children, className }: { titulo: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn('min-w-0 rounded-[14px] border border-border bg-card p-4 sm:p-5', className)}>
      <h3 className="text-xs font-medium text-muted-foreground sm:text-sm">{titulo}</h3>
      <div className="mt-2">{children}</div>
    </section>
  )
}

function KpiEsqueleto() {
  return (
    <EstadoCarregando rotulo="Carregando indicador">
      <Esqueleto className="h-8 w-24" />
      <Esqueleto className="mt-3 h-3 w-full max-w-[180px]" />
    </EstadoCarregando>
  )
}

export function KpiBacklog() {
  const kpis = useKpis()
  const status = useContagemPorStatus()

  let subtexto: string | null = null
  if (status.contagens) {
    const { ABERTA, EM_ANDAMENTO, AGUARDANDO_PECA } = status.contagens
    subtexto = `${ABERTA} ${ABERTA === 1 ? 'aberta' : 'abertas'} · ${EM_ANDAMENTO} em andamento`
    if (AGUARDANDO_PECA > 0) subtexto += `, ${AGUARDANDO_PECA} aguardando peça`
  }

  return (
    <KpiShell titulo="Backlog de manutenções">
      {kpis.isPending ? (
        <KpiEsqueleto />
      ) : kpis.isError ? (
        <EstadoErro erro={kpis.error} fallback="Não foi possível carregar o indicador." aoTentarNovamente={() => void kpis.refetch()} />
      ) : (
        <>
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            {kpis.data.backlogQuantidade}
            <span className="ml-2 text-sm font-normal text-muted-foreground">em aberto</span>
          </p>
          {subtexto && <p className="mt-2 text-xs text-muted-foreground">{subtexto}</p>}
        </>
      )}
    </KpiShell>
  )
}

export function KpiMttr() {
  const kpis = useKpis()

  return (
    <KpiShell titulo="MTTR (tempo médio de reparo)">
      {kpis.isPending ? (
        <KpiEsqueleto />
      ) : kpis.isError ? (
        <EstadoErro erro={kpis.error} fallback="Não foi possível carregar o indicador." aoTentarNovamente={() => void kpis.refetch()} />
      ) : (
        <>
          {kpis.data.mttrHoras == null ? (
            <p className="text-2xl font-semibold tracking-tight text-muted-foreground">Sem dados</p>
          ) : (
            <p className="text-3xl font-semibold tracking-tight text-foreground">
              {kpis.data.mttrHoras.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              <span className="ml-2 text-sm font-normal text-muted-foreground">horas</span>
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">Média das manutenções corretivas concluídas</p>
        </>
      )}
    </KpiShell>
  )
}

export function KpiOrcamento({ mes, ano }: { mes: number; ano: number }) {
  const query = useOrcamentoMensal(mes, ano)

  return (
    <KpiShell titulo="Orçamento do mês utilizado">
      {query.isPending ? (
        <KpiEsqueleto />
      ) : query.isError ? (
        <EstadoErro erro={query.error} fallback="Não foi possível carregar o orçamento." aoTentarNovamente={() => void query.refetch()} />
      ) : query.data === null ? (
        <>
          <p className="text-sm text-muted-foreground">Sem orçamento cadastrado para o mês</p>
          <Link
            to="/orcamentos"
            className="mt-2 inline-block rounded-sm text-xs font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            Cadastrar orçamento
          </Link>
        </>
      ) : (
        <>
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            {formatarPercentual(query.data.percentualUtilizado, 2)}
          </p>
          <div
            className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface"
            role="progressbar"
            aria-label="Orçamento do mês utilizado"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(Math.round(query.data.percentualUtilizado), 100)}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `max(4px, ${Math.min(query.data.percentualUtilizado, 100)}%)`,
                backgroundColor: query.data.percentualUtilizado > 100 ? 'var(--destructive)' : 'var(--primary)',
              }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {currencyFormatter.format(query.data.valorRealizado)} de {currencyFormatter.format(query.data.valorPlanejado)}
            {query.data.percentualUtilizado > 100 && <span className="text-destructive"> · acima do orçamento</span>}
          </p>
        </>
      )}
    </KpiShell>
  )
}

export function KpiCustoMes({ mes, ano }: { mes: number; ano: number }) {
  const mesAnterior = mes === 1 ? 12 : mes - 1
  const anoAnterior = mes === 1 ? ano - 1 : ano
  const atual = useCustoMensal(mes, ano)
  const anterior = useCustoMensal(mesAnterior, anoAnterior)

  // Só o mês atual gera erro; sem o mês anterior, apenas a comparação é omitida.
  const erro = atual.isError ? atual : null

  let comparacao: ReactNode = null
  if (atual.data && anterior.data) {
    if (anterior.data.custoTotal === 0) {
      comparacao = <span className="text-muted-foreground">Sem comparação com o mês anterior</span>
    } else {
      const variacao = ((atual.data.custoTotal - anterior.data.custoTotal) / anterior.data.custoTotal) * 100
      const arredondado = Math.round(Math.abs(variacao) * 10) / 10
      if (arredondado === 0) {
        comparacao = <span className="text-muted-foreground">Igual a {mesPorExtenso(mesAnterior)}</span>
      } else if (variacao < 0) {
        comparacao = (
          <span className="text-success">
            {formatarPercentual(arredondado, 1)} menor que em {mesPorExtenso(mesAnterior)}
          </span>
        )
      } else {
        comparacao = (
          <span className="text-warning">
            {formatarPercentual(arredondado, 1)} maior que em {mesPorExtenso(mesAnterior)}
          </span>
        )
      }
    }
  }

  return (
    <KpiShell titulo="Custo de manutenção no mês">
      {erro ? (
        <EstadoErro
          erro={erro.error}
          fallback="Não foi possível carregar o custo do mês."
          aoTentarNovamente={() => {
            void atual.refetch()
          }}
        />
      ) : atual.data ? (
        <>
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            {currencyFormatter.format(atual.data.custoTotal)}
          </p>
          {!anterior.isError && <div className="mt-2 text-xs">{comparacao ?? <Esqueleto className="h-3 w-40" />}</div>}
        </>
      ) : (
        <KpiEsqueleto />
      )}
    </KpiShell>
  )
}
