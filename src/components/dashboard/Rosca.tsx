import { Cell, Pie, PieChart } from 'recharts'

export interface FatiaRosca {
  chave: string
  valor: number
  cor: string
}

const TAMANHO = 168

// Rosca com texto central em HTML (acessível e sujeito ao tema). Fatias com valor 0 são omitidas.
export function Rosca({
  fatias,
  centro,
  legendaCentro,
  rotulo,
}: {
  fatias: FatiaRosca[]
  centro: string
  legendaCentro: string
  rotulo: string
}) {
  const visiveis = fatias.filter((f) => f.valor > 0)
  return (
    <div
      className="relative mx-auto shrink-0"
      style={{ width: TAMANHO, height: TAMANHO }}
      role="img"
      aria-label={rotulo}
    >
      <PieChart width={TAMANHO} height={TAMANHO} accessibilityLayer={false}>
        <Pie
          data={visiveis}
          dataKey="valor"
          nameKey="chave"
          innerRadius={54}
          outerRadius={78}
          paddingAngle={visiveis.length > 1 ? 2 : 0}
          stroke="none"
          startAngle={90}
          endAngle={-270}
          isAnimationActive={false}
        >
          {visiveis.map((f) => (
            <Cell key={f.chave} fill={f.cor} />
          ))}
        </Pie>
      </PieChart>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-semibold tracking-tight text-foreground">{centro}</span>
        <span className="text-xs text-muted-foreground">{legendaCentro}</span>
      </div>
    </div>
  )
}
