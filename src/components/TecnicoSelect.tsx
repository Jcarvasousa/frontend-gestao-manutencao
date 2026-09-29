import { useEffect, useState } from 'react'
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { Combobox } from '@base-ui/react/combobox'
import { X } from 'lucide-react'
import { buscarTecnicos } from '@/api/tecnicos'
import { cn } from '@/lib/utils'
import type { Tecnico } from '@/types/Tecnico'

interface TecnicoSelectProps {
  value: string
  onChange: (tecnicoId: string, tecnico: Tecnico | null) => void
  id?: string
  invalid?: boolean
  disabled?: boolean
  placeholder?: string
  clearable?: boolean
}

const TAMANHO_LISTA = 100
const ORDENACAO = 'nome,asc'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function rotuloTecnico(tecnico: Tecnico) {
  return tecnico.nome
}

export function TecnicoSelect({
  value,
  onChange,
  id,
  invalid,
  disabled,
  placeholder = 'Buscar técnico por nome...',
  clearable,
}: TecnicoSelectProps) {
  const [aberto, setAberto] = useState(false)
  const [selecionado, setSelecionado] = useState<Tecnico | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [digitado, setDigitado] = useState('')
  const [busca, setBusca] = useState('')

  // Reset externo (ex.: formulário limpo): value volta para '' enquanto ainda há técnico guardado.
  if (value === '' && selecionado !== null) {
    setSelecionado(null)
    setInputValue('')
    setDigitado('')
    setBusca('')
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => setBusca(digitado.trim()), 300)
    return () => window.clearTimeout(timeout)
  }, [digitado])

  const query = useInfiniteQuery({
    queryKey: ['tecnicos', 'select', { busca, sort: ORDENACAO }],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      buscarTecnicos({
        nome: busca || undefined,
        page: pageParam,
        size: TAMANHO_LISTA,
        sort: ORDENACAO,
      }),
    getNextPageParam: (ultimaPagina) => (ultimaPagina.last ? undefined : ultimaPagina.number + 1),
    enabled: aberto,
    placeholderData: keepPreviousData,
  })

  // O backend não filtra por situação: só técnicos ativos podem ser vinculados.
  const tecnicos = (query.data?.pages.flatMap((pagina) => pagina.content) ?? []).filter((tecnico) => tecnico.ativo)
  const totalElements = query.data?.pages[0]?.totalElements ?? 0
  const carregados = query.data?.pages.reduce((total, pagina) => total + pagina.content.length, 0) ?? 0
  const buscando = query.isFetching || digitado.trim() !== busca
  const podeLimpar = Boolean(clearable && selecionado && !disabled)

  function limpar() {
    setSelecionado(null)
    setInputValue('')
    setDigitado('')
    setBusca('')
    onChange('', null)
  }

  return (
    <Combobox.Root<Tecnico>
      items={tecnicos}
      filteredItems={tecnicos}
      value={selecionado}
      onValueChange={(tecnico) => {
        setSelecionado(tecnico)
        onChange(tecnico ? String(tecnico.id) : '', tecnico)
      }}
      inputValue={inputValue}
      onInputValueChange={(texto, details) => {
        setInputValue(texto)
        setDigitado(details.reason === 'input-change' ? texto : '')
      }}
      open={aberto}
      onOpenChange={setAberto}
      itemToStringLabel={rotuloTecnico}
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
              {buscando ? 'Buscando...' : 'Nenhum técnico ativo encontrado'}
            </Combobox.Empty>
            <Combobox.List className="p-1">
              {(tecnico: Tecnico) => (
                <Combobox.Item
                  key={tecnico.id}
                  value={tecnico}
                  className={cn(
                    'flex cursor-default flex-col gap-0.5 rounded-md px-2 py-1.5 outline-none select-none',
                    'data-highlighted:bg-accent data-highlighted:text-accent-foreground',
                    'data-selected:font-medium',
                  )}
                >
                  <span>{rotuloTecnico(tecnico)}</span>
                  <span className="text-xs text-muted-foreground">
                    {currencyFormatter.format(tecnico.custoPorHora)}/h
                  </span>
                </Combobox.Item>
              )}
            </Combobox.List>
            {query.hasNextPage && (
              <div className="flex items-center justify-between gap-2 border-t px-2.5 py-1.5 text-xs text-muted-foreground">
                <span>
                  Mostrando {carregados} de {totalElements}.
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
