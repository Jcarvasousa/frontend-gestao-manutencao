import { useEffect, useState } from 'react'
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { Combobox } from '@base-ui/react/combobox'
import { buscarPecas } from '@/api/pecas'
import { cn } from '@/lib/utils'
import { UNIDADE_MEDIDA_LABELS } from '@/types/UnidadeMedida'
import type { Peca } from '@/types/Peca'

interface PecaSelectProps {
  value: string
  onChange: (pecaId: string, peca: Peca | null) => void
  id?: string
  invalid?: boolean
  disabled?: boolean
}

const TAMANHO_LISTA = 100
const ORDENACAO = 'codigo,asc'

function rotuloPeca(peca: Peca) {
  return `${peca.codigo} - ${peca.nome}`
}

export function PecaSelect({ value, onChange, id, invalid, disabled }: PecaSelectProps) {
  const [aberto, setAberto] = useState(false)
  const [selecionada, setSelecionada] = useState<Peca | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [digitado, setDigitado] = useState('')
  const [busca, setBusca] = useState('')

  // Reset externo (ex.: dialog reaberto): value volta para '' enquanto ainda há peça guardada.
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
    queryKey: ['pecas', 'select', { busca, sort: ORDENACAO }],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      buscarPecas({
        busca: busca || undefined,
        page: pageParam,
        size: TAMANHO_LISTA,
        sort: ORDENACAO,
      }),
    getNextPageParam: (ultimaPagina) => (ultimaPagina.last ? undefined : ultimaPagina.number + 1),
    enabled: aberto,
    placeholderData: keepPreviousData,
  })

  const pecas = query.data?.pages.flatMap((pagina) => pagina.content) ?? []
  const totalElements = query.data?.pages[0]?.totalElements ?? 0
  const buscando = query.isFetching || digitado.trim() !== busca

  return (
    <Combobox.Root<Peca>
      items={pecas}
      filteredItems={pecas}
      value={selecionada}
      onValueChange={(peca) => {
        setSelecionada(peca)
        onChange(peca ? String(peca.id) : '', peca)
      }}
      inputValue={inputValue}
      onInputValueChange={(texto, details) => {
        setInputValue(texto)
        setDigitado(details.reason === 'input-change' ? texto : '')
      }}
      open={aberto}
      onOpenChange={setAberto}
      itemToStringLabel={rotuloPeca}
      isItemEqualToValue={(a, b) => a.id === b.id}
      disabled={disabled}
    >
      <Combobox.Input
        id={id}
        placeholder="Buscar por código, nome ou categoria..."
        aria-invalid={invalid || undefined}
        className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
      />
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} className="z-[60]">
          <Combobox.Popup className="max-h-64 w-(--anchor-width) overflow-y-auto rounded-lg bg-popover text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10">
            <Combobox.Empty className="px-2.5 py-2 text-sm text-muted-foreground empty:hidden">
              {buscando ? 'Buscando...' : 'Nenhuma peça encontrada'}
            </Combobox.Empty>
            <Combobox.List className="p-1">
              {(peca: Peca) => (
                <Combobox.Item
                  key={peca.id}
                  value={peca}
                  className={cn(
                    'flex cursor-default flex-col gap-0.5 rounded-md px-2 py-1.5 outline-none select-none',
                    'data-highlighted:bg-accent data-highlighted:text-accent-foreground',
                    'data-selected:font-medium',
                  )}
                >
                  <span>{rotuloPeca(peca)}</span>
                  <span className="text-xs text-muted-foreground">
                    {[
                      peca.categoria,
                      UNIDADE_MEDIDA_LABELS[peca.unidadeMedida],
                      `Saldo: ${peca.quantidadeAtual}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </Combobox.Item>
              )}
            </Combobox.List>
            {query.hasNextPage && (
              <div className="flex items-center justify-between gap-2 border-t px-2.5 py-1.5 text-xs text-muted-foreground">
                <span>
                  Mostrando {pecas.length} de {totalElements}.
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
