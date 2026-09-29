import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { mensagemDeErro } from '@/lib/erros'

export function CardShell({
  titulo,
  subtitulo,
  linkTexto,
  linkPara,
  className,
  children,
}: {
  titulo: string
  subtitulo?: string
  linkTexto?: string
  linkPara?: string
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn('min-w-0 rounded-[14px] border border-border bg-card p-5', className)}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">{titulo}</h3>
          {subtitulo && <p className="mt-0.5 text-xs text-muted-foreground">{subtitulo}</p>}
        </div>
        {linkTexto && linkPara && <LinkDestaque para={linkPara}>{linkTexto}</LinkDestaque>}
      </header>
      <div className="mt-4">{children}</div>
    </section>
  )
}

export function LinkDestaque({ para, children }: { para: string; children: ReactNode }) {
  return (
    <Link
      to={para}
      className="shrink-0 rounded-sm text-xs font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </Link>
  )
}

export function Esqueleto({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={cn('animate-pulse rounded-lg bg-surface', className)} style={style} aria-hidden="true" />
}

export function EstadoCarregando({ children, rotulo }: { children: ReactNode; rotulo: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={rotulo}>
      {children}
    </div>
  )
}

export function EstadoErro({
  erro,
  fallback,
  aoTentarNovamente,
}: {
  erro: unknown
  fallback: string
  aoTentarNovamente: () => void
}) {
  return (
    <div role="alert" className="flex flex-col items-start gap-2 text-sm">
      <p className="text-destructive">{mensagemDeErro(erro, fallback)}</p>
      <Button variant="outline" size="sm" onClick={aoTentarNovamente}>
        Tentar novamente
      </Button>
    </div>
  )
}

export function Bolinha({ cor, className }: { cor: string; className?: string }) {
  return (
    <span
      className={cn('inline-block size-2.5 shrink-0 rounded-full', className)}
      style={{ backgroundColor: cor }}
      aria-hidden="true"
    />
  )
}
