import { useEffect, useState } from 'react'
import { useIsFetching } from '@tanstack/react-query'
import { mesPorExtenso } from '@/components/dashboard/formatos'
import { ComprasPendentesCard } from '@/components/dashboard/ComprasPendentesCard'
import { CustoMensalCard } from '@/components/dashboard/CustoMensalCard'
import { KpiBacklog, KpiCustoMes, KpiMttr, KpiOrcamento } from '@/components/dashboard/KpiCards'
import { PecasCard } from '@/components/dashboard/PecasCard'
import { SetoresCard } from '@/components/dashboard/SetoresCard'
import { StatusCard } from '@/components/dashboard/StatusCard'
import { TipoCard } from '@/components/dashboard/TipoCard'

const LIMITE_LENTO_MS = 8000

// Nota discreta se alguma consulta ainda sem dados passar de 8 s carregando (servidor de demonstração dormindo).
function useCarregandoHaMuito(): boolean {
  const pendentes = useIsFetching({ predicate: (query) => query.state.status === 'pending' })
  const [lento, setLento] = useState(false)
  const carregando = pendentes > 0

  useEffect(() => {
    if (!carregando) return
    const timer = window.setTimeout(() => setLento(true), LIMITE_LENTO_MS)
    return () => {
      window.clearTimeout(timer)
      setLento(false)
    }
  }, [carregando])

  return carregando && lento
}

export function Dashboard() {
  // Mês atual do navegador, fixado na montagem da página.
  const [hoje] = useState(() => new Date())
  const mes = hoje.getMonth() + 1
  const ano = hoje.getFullYear()
  const demorando = useCarregandoHaMuito()

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:py-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h2>
          <p className="mt-1 text-sm text-muted-foreground">Visão geral da manutenção</p>
        </div>
        <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
          Custos de referência: {mesPorExtenso(mes)}/{ano}
        </span>
      </header>

      {demorando && (
        <p role="status" className="mt-4 text-xs text-muted-foreground">
          O servidor de demonstração pode levar até 1 minuto para acordar na primeira visita.
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiBacklog />
        <KpiMttr />
        <div className="col-span-2 md:col-span-1">
          <KpiOrcamento mes={mes} ano={ano} />
        </div>
        <div className="col-span-2 md:col-span-1">
          <KpiCustoMes mes={mes} ano={ano} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
        <StatusCard />
        <PecasCard className="lg:col-span-5" />
        <CustoMensalCard mes={mes} ano={ano} className="lg:col-span-7" />
        <SetoresCard mes={mes} ano={ano} className="lg:col-span-6" />
        <TipoCard className="lg:col-span-6" />
        <ComprasPendentesCard />
      </div>
    </section>
  )
}
