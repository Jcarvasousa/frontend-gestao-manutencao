import { useEffect, useState } from 'react'
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { Combobox } from '@base-ui/react/combobox'
import { X } from 'lucide-react'
import { buscarMaquinas } from '@/api/maquinas'
import { cn } from '@/lib/utils'
import type { Maquina, StatusMaquina } from '@/types/Maquina'

interface MaquinaSelectProps {
  value: string
  onChange: (maquinaId: string, maquina: Maquina | null) => void
  id?: string
  invalid?: boolean
  disabled?: boolean
  placeholder?: string
  clearable?: boolean
}

const TAMANHO_LISTA = 100
const ORDENACAO = 'codigo,asc'

const STATUS_LABELS: Record<StatusMaquina, string> = {
  ATIVA: 'Ativa',
  PARADA: 'Parada',
  EM_MANUTENCAO: 'Em manutenção',
  INATIVA: 'Inativa',
}

function rotuloMaquina(maquina: Maquina) {
  return `${maquina.codigo} - ${maquina.descricao}`
}

export function MaquinaSelect({
  value,
  onChange,
  id,
  invalid,
  disabled,
  placeholder = 'Buscar por código, descrição ou setor...',
  clearable,
}: MaquinaSelectProps) {
  const [aberto, setAberto] = useState(false)
  const [selecionada, setSelecionada] = useState<Maquina | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [digitado, setDigitado] = useState('')
  const [busca, setBusca] = useState('')

  // Reset externo (ex.: dialog reaberto): value volta para '' enquanto ainda há máquina guardada.
  if (value === '' && selecionada !== null) {
    setSelecionada(null)
    setInputValue('')
    setDigitado('')
    setBusca('')
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => setBusca(digitado.trim()), 300)
    return () => window.clearTimeout(timeout)
  }, [digitado])

  const query = useInfiniteQuery({
    queryKey: ['maquinas', 'select', { busca, sort: ORDENACAO }],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      buscarMaquinas({
        busca: busca || undefined,
        page: pageParam,
        size: TAMANHO_LISTA,
        sort: ORDENACAO,
      }),
    getNextPageParam: (ultimaPagina) => (ultimaPagina.last ? undefined : ultimaPagina.number + 1),
    enabled: aberto,
    placeholderData: keepPreviousData,
  })

  const maquinas = query.data?.pages.flatMap((pagina) => pagina.content) ?? []
  const totalElements = query.data?.pages[0]?.totalElements ?? 0
  const buscando = query.isFetching || digitado.trim() !== busca
  const podeLimpar = Boolean(clearable && selecionada && !disabled)

  function limpar() {
    setSelecionada(null)
    setInputValue('')
    setDigitado('')
    setBusca('')
    onChange('', null)
  }

  return (
    <Combobox.Root<Maquina>
      items={maquinas}
      filteredItems={maquinas}
      value={selecionada}
      onValueChange={(maquina) => {
        setSelecionada(maquina)
        onChange(maquina ? String(maquina.id) : '', maquina)
      }}
      inputValue={inputValue}
      onInputValueChange={(texto, details) => {
        setInputValue(texto)
        setDigitado(details.reason === 'input-change' ? texto : '')
      }}
      open={aberto}
      onOpenChange={setAberto}
      itemToStringLabel={rotuloMaquina}
      isItemEqualToValue={(a, b) => a.id === b.id}
      disabled={disabled}
    >
      <div className="relative">
        <Combobox.Input
          id={id}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          className={cn(
            'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
            podeLimpar && 'pr-8',
          )}
        />
        {podeLimpar && (
          <button
            type="button"
            aria-label="Limpar seleção"
            className="absolute inset-y-0 right-1 my-auto flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onMouseDown={(e) => e.preventDefault()}
            onClick={limpar}
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} className="z-[60]">
          <Combobox.Popup className="max-h-64 w-(--anchor-width) overflow-y-auto rounded-lg bg-popover text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10">
            <Combobox.Empty className="px-2.5 py-2 text-sm text-muted-foreground empty:hidden">
              {buscando ? 'Buscando...' : 'Nenhuma máquina encontrada'}
            </Combobox.Empty>
            <Combobox.List className="p-1">
              {(maquina: Maquina) => (
                <Combobox.Item
                  key={maquina.id}
                  value={maquina}
                  className={cn(
                    'flex cursor-default flex-col gap-0.5 rounded-md px-2 py-1.5 outline-none select-none',
                    'data-highlighted:bg-accent data-highlighted:text-accent-foreground',
                    'data-selected:font-medium',
                  )}
                >
                  <span>{rotuloMaquina(maquina)}</span>
                  <span className="text-xs text-muted-foreground">
                    {[maquina.setorNome, STATUS_LABELS[maquina.status]].filter(Boolean).join(' · ')}
                  </span>
                </Combobox.Item>
              )}
            </Combobox.List>
            {query.hasNextPage && (
              <div className="flex items-center justify-between gap-2 border-t px-2.5 py-1.5 text-xs text-muted-foreground">
                <span>
                  Mostrando {maquinas.length} de {totalElements}.
                </span>
                <button
                  type="button"
                  className="text-xs font-medium text-foreground underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={query.isFetchingNextPage}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => query.fetchNextPage()}
                >
                  {query.isFetchingNextPage ? 'Carregando...' : 'Carregar mais'}
                </button>
              </div>
            )}
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}
