import { NOMES_MESES } from '@/lib/meses'
import { ROTULOS_MODO_PERIODO, type ModoPeriodo } from '@/lib/periodoRelatorio'

interface PeriodoRelatorioSelectorProps {
  idPrefix: string
  modo: ModoPeriodo
  mes: number | ''
  ano: number | ''
  onModoChange: (modo: ModoPeriodo) => void
  onMesChange: (mes: number | '') => void
  onAnoChange: (ano: number | '') => void
}

const CLASSE_SELECT =
  'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm'

const MODOS: ModoPeriodo[] = ['mensal', 'anual', 'total']

export function PeriodoRelatorioSelector({
  idPrefix,
  modo,
  mes,
  ano,
  onModoChange,
  onMesChange,
  onAnoChange,
}: PeriodoRelatorioSelectorProps) {
  const anoAtual = new Date().getFullYear()
  const anos = Array.from({ length: 6 }, (_, index) => anoAtual - 3 + index)

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="flex-1">
        <label className="mb-1.5 block text-sm font-medium" htmlFor={`${idPrefix}-modo`}>
          Período
        </label>
        <select
          id={`${idPrefix}-modo`}
          value={modo}
          onChange={(event) => onModoChange(event.target.value as ModoPeriodo)}
          className={CLASSE_SELECT}
        >
          {MODOS.map((opcao) => (
            <option key={opcao} value={opcao}>
              {ROTULOS_MODO_PERIODO[opcao]}
            </option>
          ))}
        </select>
      </div>
      {modo === 'mensal' && (
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium" htmlFor={`${idPrefix}-mes`}>
            Mês
          </label>
          <select
            id={`${idPrefix}-mes`}
            value={mes}
            onChange={(event) => onMesChange(event.target.value === '' ? '' : Number(event.target.value))}
            className={CLASSE_SELECT}
          >
            <option value="">Selecione</option>
            {NOMES_MESES.map((nome, index) => (
              <option key={nome} value={index + 1}>
                {nome}
              </option>
            ))}
          </select>
        </div>
      )}
      {modo !== 'total' && (
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium" htmlFor={`${idPrefix}-ano`}>
            Ano
          </label>
          <select
            id={`${idPrefix}-ano`}
            value={ano}
            onChange={(event) => onAnoChange(event.target.value === '' ? '' : Number(event.target.value))}
            className={CLASSE_SELECT}
          >
            <option value="">Selecione</option>
            {anos.map((anoOpcao) => (
              <option key={anoOpcao} value={anoOpcao}>
                {anoOpcao}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
