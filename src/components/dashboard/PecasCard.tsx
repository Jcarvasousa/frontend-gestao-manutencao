import { useQuery } from '@tanstack/react-query'
import { buscarPendentes } from '@/api/solicitacoesCompra'
import type { Peca } from '@/types/Peca'
import { UNIDADE_MEDIDA_LABELS, type UnidadeMedida } from '@/types/UnidadeMedida'
import { formatarNumero, formatarPercentual } from '@/components/dashboard/formatos'
import { usePecasAbaixoDoMinimo, useTotalCatalogo } from '@/components/dashboard/queries'
import { CardShell, Esqueleto, EstadoCarregando, EstadoErro, LinkDestaque } from '@/components/dashboard/ui'

const AMBAR = '#FBBF24'
const UNIDADES_EM_PALAVRA: UnidadeMedida[] = ['UN', 'CAIXA', 'SACO', 'PACOTE']

function rotuloUnidade(unidade: UnidadeMedida): string {
  const rotulo = UNIDADE_MEDIDA_LABELS[unidade]
  return UNIDADES_EM_PALAVRA.includes(unidade) ? rotulo.toLocaleLowerCase('pt-BR') : rotulo
}

function maisCriticas(pecas: Peca[]): (Peca & { estoqueMinimo: number })[] {
  return pecas
    .filter((p): p is Peca & { estoqueMinimo: number } => p.estoqueMinimo != null && p.estoqueMinimo > 0)
    .sort((a, b) => a.quantidadeAtual / a.estoqueMinimo - b.quantidadeAtual / b.estoqueMinimo)
    .slice(0, 3)
}

// Medidor semicircular em SVG próprio: comprimento normalizado (pathLength = 100).
function Medidor({ fracao, valor, total }: { fracao: number; valor: number; total: number }) {
  const preenchido = valor > 0 ? Math.max(fracao * 100, 2) : 0
  return (
    <div className="relative mx-auto w-full max-w-[220px]">
      <svg viewBox="0 0 200 110" className="w-full" aria-hidden="true">
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="var(--border)" strokeWidth="14" strokeLinecap="round" pathLength={100} />
        {preenchido > 0 && (
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={AMBAR}
            strokeWidth="14"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${preenchido} 100`}
          />
        )}
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <p className="text-3xl font-semibold leading-none tracking-tight text-foreground">{valor}</p>
        <p className="mt-1 text-xs text-muted-foreground">de {total} peças</p>
      </div>
    </div>
  )
}

export function PecasCard({ className }: { className?: string }) {
  const abaixo = usePecasAbaixoDoMinimo()
  const total = useTotalCatalogo()
  const pendentes = useQuery({ queryKey: ['solicitacoes-pendentes'], queryFn: buscarPendentes })

  const pendente = abaixo.isPending || total.isPending
  const falha = abaixo.isError ? abaixo : total.isError ? total : null

  return (
    <CardShell titulo="Peças abaixo do mínimo" subtitulo="Precisam de reposição" linkTexto="Ver peças" linkPara="/pecas" className={className}>
      {falha ? (
        <EstadoErro
          erro={falha.error}
          fallback="Não foi possível carregar as peças."
          aoTentarNovamente={() => {
            void abaixo.refetch()
            void total.refetch()
          }}
        />
      ) : pendente || !abaixo.data || total.data === undefined ? (
        <EstadoCarregando rotulo="Carregando peças abaixo do mínimo">
          <Esqueleto className="mx-auto h-[110px] w-full max-w-[220px]" />
          <Esqueleto className="mx-auto mt-4 h-3 w-48" />
          <Esqueleto className="mt-4 h-10 w-full" />
        </EstadoCarregando>
      ) : (
        <Conteudo abaixo={abaixo.data} totalCatalogo={total.data} pendentes={pendentes.data?.length} />
      )}
    </CardShell>
  )
}

function Conteudo({ abaixo, totalCatalogo, pendentes }: { abaixo: Peca[]; totalCatalogo: number; pendentes: number | undefined }) {
  const quantidade = abaixo.length
  const fracao = totalCatalogo > 0 ? Math.min(quantidade / totalCatalogo, 1) : 0
  const criticas = maisCriticas(abaixo)
  const percentual = formatarPercentual(fracao * 100, 1)

  return (
    <div>
      <div
        role="img"
        aria-label={
          quantidade === 0
            ? `Estoque em dia: nenhuma das ${totalCatalogo} peças está abaixo do mínimo.`
            : `${quantidade} de ${totalCatalogo} peças abaixo do estoque mínimo (${percentual} do catálogo).`
        }
      >
        <Medidor fracao={fracao} valor={quantidade} total={totalCatalogo} />
      </div>

      {quantidade === 0 ? (
        <p className="mt-4 text-center text-sm font-medium text-success">Estoque em dia</p>
      ) : (
        <>
          <p className="mt-4 text-center text-xs text-muted-foreground">{percentual} do catálogo está abaixo do estoque mínimo</p>
          {criticas.length > 0 && (
            <ul className="mt-4 space-y-3">
              {criticas.map((peca) => (
                <li key={peca.id}>
                  <p className="truncate text-xs text-foreground">
                    <span className="font-medium">{peca.codigo}</span> {peca.nome} — {formatarNumero(peca.quantidadeAtual)} de{' '}
                    {formatarNumero(peca.estoqueMinimo)} {rotuloUnidade(peca.unidadeMedida)}
                  </p>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface" aria-hidden="true">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min((peca.quantidadeAtual / peca.estoqueMinimo) * 100, 100)}%`,
                        minWidth: peca.quantidadeAtual > 0 ? undefined : 0,
                        backgroundColor: AMBAR,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
        <span>
          {pendentes === undefined
            ? 'Compras pendentes de orçamento indisponíveis'
            : `${pendentes} ${pendentes === 1 ? 'compra pendente' : 'compras pendentes'} de orçamento`}
        </span>
        <LinkDestaque para="/compras">Ver compras</LinkDestaque>
      </div>
    </div>
  )
}
