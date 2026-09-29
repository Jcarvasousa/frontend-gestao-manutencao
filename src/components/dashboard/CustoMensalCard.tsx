import { useEffect, useRef, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, useChartWidth, useXAxisScale, useYAxisScale, XAxis, YAxis } from 'recharts'
import { currencyFormatter } from '@/lib/formatadores'
import { nomeMes } from '@/lib/meses'
import {
  ABREVIACOES_MES,
  formatarMoedaInteira,
  formatarNumero,
  rotuloCurto,
  rotuloEixo,
  type MesReferencia,
} from '@/components/dashboard/formatos'
import { useCustoMensalMeses } from '@/components/dashboard/queries'
import { useMediaQuery } from '@/components/dashboard/useMediaQuery'
import { Bolinha, CardShell, Esqueleto, EstadoCarregando } from '@/components/dashboard/ui'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

const COR_PECAS = '#2DD4BF'
const COR_MAO_DE_OBRA = '#64748B'
const ROTULO_MAO_DE_OBRA = 'Mão de obra (técnicos + terceiros)'
const MARGEM_DIREITA = 12
const LARGURA_Y = 56
const LARGURA_Y_COMPACTO = 42
const LARGURA_MIN_BARRA = 24
const PX_POR_CARACTERE = 6.2 // texto de 11 px, aproximado

interface LinhaMes extends MesReferencia {
  pecas: number
  maoDeObra: number
  total: number
  estado: 'ok' | 'carregando' | 'erro'
  esqueleto: number
}

function formatarEixoY(valor: number, compacto: boolean): string {
  if (valor === 0) return '0'
  if (Math.abs(valor) < 1000) return formatarNumero(valor)
  return `${formatarNumero(valor / 1000)}${compacto ? 'k' : ' mil'}`
}

const MULTIPLICADORES_PASSO = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8]
const MAX_MARCAS = 5

// Menor passo "redondo" que cobre o maior valor em no máximo MAX_MARCAS marcas acima do zero.
// O topo é o próximo múltiplo do passo acima do maior valor, o que garante folga para o rótulo de total.
function calcularEscalaY(maior: number): { ticks: number[]; topo: number } {
  if (maior <= 0) return { ticks: [0, 1], topo: 1 }
  for (let potencia = 10; ; potencia *= 10) {
    for (const m of MULTIPLICADORES_PASSO) {
      const passo = m * potencia
      const marcas = Math.floor(maior / passo) + 1
      if (marcas <= MAX_MARCAS) {
        return { ticks: Array.from({ length: marcas + 1 }, (_, i) => i * passo), topo: marcas * passo }
      }
    }
  }
}

interface TickProps {
  x?: number | string
  y?: number | string
  payload?: { value: string | number }
}

// Total inteiro sobre as barras indicadas, posicionado pelas escalas do gráfico.
function TotaisSobreBarras({ dados, indices }: { dados: LinhaMes[]; indices: number[] }) {
  const escalaX = useXAxisScale()
  const escalaY = useYAxisScale()
  const larguraGrafico = useChartWidth()
  if (!escalaX || !escalaY) return null
  const limite = larguraGrafico ? larguraGrafico - 2 : Infinity
  return (
    <g>
      {indices.map((i) => {
        const cx = escalaX(dados[i].indice, { position: 'middle' })
        const y = escalaY(dados[i].total)
        if (cx === undefined || y === undefined) return null
        const texto = formatarMoedaInteira(dados[i].total)
        const largura = texto.length * PX_POR_CARACTERE
        const ultima = i === dados.length - 1
        let x: number
        let ancora: 'middle' | 'end' = 'middle'
        if (ultima && cx + largura / 2 > limite) {
          x = limite
          ancora = 'end'
        } else {
          x = Math.min(Math.max(cx, largura / 2 + 2), limite - largura / 2)
        }
        return (
          <text key={dados[i].indice} x={x} y={y - 6} textAnchor={ancora} fontSize={11} fontWeight={600} fill="#E8E8EC">
            {texto}
          </text>
        )
      })}
    </g>
  )
}

function TooltipCusto({ active, payload }: { active?: boolean; payload?: { payload: LinhaMes }[] }) {
  const linha = active ? payload?.[0]?.payload : undefined
  if (!linha || linha.estado !== 'ok') return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <ValoresMes linha={linha} />
    </div>
  )
}

function ValoresMes({ linha }: { linha: LinhaMes }) {
  return (
    <>
      <p className="font-medium text-foreground">
        {nomeMes(linha.mes)}/{linha.ano}
      </p>
      <dl className="mt-1.5 space-y-1">
        <div className="flex justify-between gap-6">
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <Bolinha cor={COR_PECAS} className="size-2" />
            Peças
          </dt>
          <dd className="text-foreground">{currencyFormatter.format(linha.pecas)}</dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <Bolinha cor={COR_MAO_DE_OBRA} className="size-2" />
            {ROTULO_MAO_DE_OBRA}
          </dt>
          <dd className="text-foreground">{currencyFormatter.format(linha.maoDeObra)}</dd>
        </div>
        <div className="flex justify-between gap-6 border-t border-border pt-1 font-medium">
          <dt className="text-foreground">Total</dt>
          <dd className="text-foreground">{currencyFormatter.format(linha.total)}</dd>
        </div>
      </dl>
    </>
  )
}

export function CustoMensalCard({ mes, ano, className }: { mes: number; ano: number; className?: string }) {
  const { janela, resultados } = useCustoMensalMeses(mes, ano)
  const compacto = useMediaQuery('(max-width: 639px)')
  const toque = useMediaQuery('(hover: none), (pointer: coarse)')
  const usaPainel = compacto || toque
  const [larguraContainer, setLarguraContainer] = useState(0)
  const [indiceSelecionado, setIndiceSelecionado] = useState<number | null>(null)
  const graficoRef = useRef<HTMLDivElement>(null)
  const painelRef = useRef<HTMLDivElement>(null)

  const carregados = resultados.map((r) => r.data)
  const maiorCarregado = Math.max(0, ...carregados.map((d) => d?.custoTotal ?? 0))

  const dados: LinhaMes[] = janela.map((ref, i) => {
    const r = resultados[i]
    const d = r.data
    if (d) {
      return { ...ref, pecas: d.custoPecas, maoDeObra: d.custoMaoDeObra, total: d.custoTotal, estado: 'ok', esqueleto: 0 }
    }
    const estado = r.isError ? 'erro' : 'carregando'
    return {
      ...ref,
      pecas: 0,
      maoDeObra: 0,
      total: 0,
      estado,
      esqueleto: estado === 'carregando' ? Math.max(maiorCarregado * 0.25, 500) : 0,
    }
  })

  const linhaSelecionada = usaPainel && indiceSelecionado !== null ? dados[indiceSelecionado] : undefined
  const painelAberto = linhaSelecionada?.estado === 'ok'

  useEffect(() => {
    if (!painelAberto) return
    const aoTocar = (e: PointerEvent) => {
      const alvo = e.target as Node | null
      if (alvo && (graficoRef.current?.contains(alvo) || painelRef.current?.contains(alvo))) return
      setIndiceSelecionado(null)
    }
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIndiceSelecionado(null)
    }
    document.addEventListener('pointerdown', aoTocar)
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('pointerdown', aoTocar)
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [painelAberto])

  // Único ponto de seleção: o índice vem da própria barra tocada (não do estado de hover do gráfico,
  // que em toque pode estar defasado). Barra diferente troca direto; a mesma fecha.
  function aoTocarBarra(_dado: unknown, indice: number) {
    if (!usaPainel || dados[indice]?.estado !== 'ok') return
    setIndiceSelecionado((atual) => (atual === indice ? null : indice))
  }

  const opacidade = (i: number) => (painelAberto && i !== indiceSelecionado ? 0.55 : 1)

  const carregando = dados.filter((d) => d.estado === 'carregando').length
  const falhas = dados.filter((d) => d.estado === 'erro').length
  const tudoPendente = carregando === dados.length
  const completo = carregando === 0 && falhas === 0

  const total12 = dados.reduce((soma, d) => soma + d.total, 0)
  const media = total12 / 12
  const indiceMaior = dados.reduce((melhor, d, i) => (d.total > dados[melhor].total ? i : melhor), 0)
  const indiceAtual = dados.length - 1
  const rotularIndices = new Set<number>()
  if (dados[indiceMaior].total > 0) rotularIndices.add(indiceMaior)
  if (dados[indiceAtual].estado === 'ok') rotularIndices.add(indiceAtual)

  const primeiro = janela[0]
  const ultimo = janela[janela.length - 1]
  const subtitulo = compacto
    ? `Por mês de conclusão · ${rotuloCurto(primeiro)} a ${rotuloCurto(ultimo)}`
    : 'Por mês de conclusão das manutenções'

  const aria = completo
    ? `Custo de manutenção dos últimos 12 meses, de ${rotuloCurto(primeiro)} a ${rotuloCurto(ultimo)}. Total ${formatarMoedaInteira(total12)}, média mensal ${formatarMoedaInteira(media)}. Maior custo em ${rotuloCurto(dados[indiceMaior])}: ${formatarMoedaInteira(dados[indiceMaior].total)}.`
    : 'Custo de manutenção dos últimos 12 meses (dados incompletos).'

  function tentarNovamente() {
    resultados.forEach((r) => {
      if (r.isError) void r.refetch()
    })
  }

  const larguraY = compacto ? LARGURA_Y_COMPACTO : LARGURA_Y
  const larguraPorBarra = larguraContainer > 0 ? (larguraContainer - larguraY - MARGEM_DIREITA) / dados.length : Infinity
  const girar = compacto && larguraPorBarra < LARGURA_MIN_BARRA
  const maiorTotal = Math.max(0, ...dados.map((d) => d.total + d.esqueleto))
  const { ticks: ticksY, topo: topoY } = calcularEscalaY(maiorTotal)
  const dominioY: [number, number] = [0, topoY]

  const renderTickY = ({ x, y, payload }: TickProps) => (
    <text x={Number(x)} y={Number(y)} dy={4} textAnchor="end" fontSize={11} fill="#8B8B95">
      {formatarEixoY(Number(payload?.value), compacto)}
    </text>
  )

  const renderTick = ({ x, y, payload }: TickProps) => {
    const indice = Number(payload?.value)
    const linha = dados[indice - 1]
    if (!linha) return <g />
    const atual = linha.indice === 12
    const cor = atual ? COR_PECAS : '#8B8B95'
    const texto = compacto ? ABREVIACOES_MES[linha.mes - 1] : rotuloEixo(linha)
    if (girar) {
      return (
        <text
          x={Number(x)}
          y={Number(y) + 8}
          textAnchor="end"
          transform={`rotate(-45 ${Number(x)} ${Number(y) + 8})`}
          fontSize={10}
          fontWeight={atual ? 700 : 400}
          fill={cor}
        >
          {texto}
        </text>
      )
    }
    return (
      <text
        x={Number(x)}
        y={Number(y) + 14}
        textAnchor="middle"
        fontSize={compacto ? 10 : 11}
        fontWeight={atual ? 700 : 400}
        fill={cor}
      >
        {texto}
      </text>
    )
  }

  return (
    <CardShell titulo="Custo dos últimos 12 meses" subtitulo={subtitulo} className={className}>
      {tudoPendente ? (
        <EstadoCarregando rotulo="Carregando custo dos últimos 12 meses">
          <div className="flex h-[260px] items-end gap-2">
            {dados.map((d, i) => (
              <Esqueleto key={d.indice} className="flex-1" style={{ height: `${30 + ((i * 37) % 60)}%` }} />
            ))}
          </div>
        </EstadoCarregando>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Bolinha cor={COR_PECAS} /> Peças
            </span>
            <span className="flex items-center gap-1.5">
              <Bolinha cor={COR_MAO_DE_OBRA} /> {ROTULO_MAO_DE_OBRA}
            </span>
          </div>

          <div
            ref={graficoRef}
            className="mt-3 h-[260px] w-full"
            role="img"
            aria-label={aria}
          >
            <ResponsiveContainer width="100%" height="100%" onResize={(largura) => setLarguraContainer(largura)}>
              <BarChart data={dados} margin={{ top: 28, right: MARGEM_DIREITA, bottom: 0, left: 0 }} accessibilityLayer={false}>
                <CartesianGrid vertical={false} stroke="#26262B" strokeDasharray="3 3" />
                <XAxis dataKey="indice" tickLine={false} axisLine={{ stroke: '#26262B' }} interval={0} tick={renderTick} height={girar ? 36 : 28} />
                <YAxis tickLine={false} axisLine={false} width={larguraY} domain={dominioY} ticks={ticksY} interval={0} tick={renderTickY} />
                {!usaPainel && <Tooltip content={<TooltipCusto />} cursor={{ fill: '#1C1C20' }} isAnimationActive={false} />}
                <Bar dataKey="pecas" stackId="custo" fill={COR_PECAS} name="Peças" isAnimationActive={false} onClick={aoTocarBarra}>
                  {dados.map((d, i) => (
                    <Cell key={d.indice} fill={COR_PECAS} fillOpacity={opacidade(i)} />
                  ))}
                </Bar>
                <Bar
                  dataKey="maoDeObra"
                  stackId="custo"
                  fill={COR_MAO_DE_OBRA}
                  name={ROTULO_MAO_DE_OBRA}
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={false}
                  onClick={aoTocarBarra}
                >
                  {dados.map((d, i) => (
                    <Cell key={d.indice} fill={COR_MAO_DE_OBRA} fillOpacity={opacidade(i)} />
                  ))}
                </Bar>
                <TotaisSobreBarras dados={dados} indices={[...rotularIndices]} />
                <Bar dataKey="esqueleto" stackId="custo" fill="#1C1C20" isAnimationActive={false} legendType="none">
                  {dados.map((d) => (
                    <Cell key={d.indice} className="animate-pulse" fill="#1C1C20" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {painelAberto && linhaSelecionada && (
            <div ref={painelRef} className="relative mt-2 rounded-lg border border-border bg-popover py-2 pl-3 pr-12 text-xs">
              <ValoresMes linha={linhaSelecionada} />
              <button
                type="button"
                aria-label="Fechar detalhes"
                onClick={() => setIndiceSelecionado(null)}
                className="absolute right-0 top-0 flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                <X className="size-4" />
              </button>
            </div>
          )}
          {usaPainel && <p className="mt-2 text-xs text-muted-foreground">Toque numa barra para ver o mês e os valores.</p>}

          {(falhas > 0 || carregando > 0) && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs" role={falhas > 0 ? 'alert' : 'status'}>
              {falhas > 0 && (
                <>
                  <span className="text-destructive">
                    {falhas} {falhas === 1 ? 'mês não carregou' : 'meses não carregaram'}
                  </span>
                  <Button variant="outline" size="sm" onClick={tentarNovamente}>
                    Tentar novamente
                  </Button>
                </>
              )}
              {carregando > 0 && (
                <span className="text-muted-foreground">
                  Carregando {carregando} {carregando === 1 ? 'mês' : 'meses'}…
                </span>
              )}
            </div>
          )}

          <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4">
            <div>
              <dt className="text-xs text-muted-foreground">Total em 12 meses</dt>
              <dd className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                {completo ? currencyFormatter.format(total12) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Média mensal</dt>
              <dd className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                {completo ? currencyFormatter.format(media) : '—'}
              </dd>
            </div>
          </dl>
        </>
      )}
    </CardShell>
  )
}
