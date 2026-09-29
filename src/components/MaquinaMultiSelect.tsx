import { useEffect, useState } from 'react'
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { Combobox } from '@base-ui/react/combobox'
import { X } from 'lucide-react'
import { buscarMaquinas } from '@/api/maquinas'
import { Button } from '@/components/ui/button'
import { mensagemDeErro } from '@/lib/erros'
import { cn } from '@/lib/utils'
import type { Maquina } from '@/types/Maquina'

interface MaquinaMultiSelectProps {
  value: Maquina[]
  onChange: (maquinas: Maquina[]) => void
  id?: string
  disabled?: boolean
  placeholder?: string
}

const TAMANHO_LISTA = 100
const ORDENACAO = 'codigo,asc'

function rotuloMaquina(maquina: Maquina) {
  return `${maquina.codigo} - ${maquina.descricao}`
}

export function MaquinaMultiSelect({
  value,
  onChange,
  id,
  disabled,
  placeholder = 'Buscar por código, descrição ou setor...',
}: MaquinaMultiSelectProps) {
  const [aberto, setAberto] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [digitado, setDigitado] = useState('')
  const [busca, setBusca] = useState('')
  const [selecionandoTodas, setSelecionandoTodas] = useState(false)
  const [erroTodas, setErroTodas] = useState<string | null>(null)

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

  async function selecionarTodas() {
    setSelecionandoTodas(true)
    setErroTodas(null)
    try {
      const todas: Maquina[] = []
      let pagina = 0
      for (;;) {
        const resposta = await buscarMaquinas({ page: pagina, size: TAMANHO_LISTA, sort: ORDENACAO })
        todas.push(...resposta.content)
        if (resposta.last) break
        pagina = resposta.number + 1
      }
      onChange(todas)
    } catch (error) {
      setErroTodas(mensagemDeErro(error, 'Não foi possível carregar todas as máquinas.'))
    } finally {
      setSelecionandoTodas(false)
    }
  }

  return (
    <div>
      <Combobox.Root<Maquina, true>
        multiple
        items={maquinas}
        filteredItems={maquinas}
        value={value}
        onValueChange={(selecionadas) => onChange(selecionadas)}
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
        <Combobox.Chips className="flex max-h-40 min-h-8 w-full flex-wrap items-center gap-1 overflow-y-auto rounded-lg border border-input bg-transparent px-1.5 py-1 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
          {value.map((maquina) => (
            <Combobox.Chip
              key={maquina.id}
              className="flex max-w-full items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground outline-none data-highlighted:bg-accent"
            >
              <span className="truncate">{rotuloMaquina(maquina)}</span>
              <Combobox.ChipRemove
                aria-label={`Remover ${rotuloMaquina(maquina)}`}
                className="flex size-4 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-background hover:text-foreground"
              >
                <X aria-hidden="true" className="size-3" />
              </Combobox.ChipRemove>
            </Combobox.Chip>
          ))}
          <Combobox.Input
            id={id}
            placeholder={value.length === 0 ? placeholder : ''}
            className="h-6 min-w-32 flex-1 bg-transparent px-1 text-base outline-none placeholder:text-muted-foreground md:text-sm"
          />
        </Combobox.Chips>
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
                    <span className="text-xs text-muted-foreground">{maquina.setorNome ?? 'Sem setor'}</span>
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
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={disabled || selecionandoTodas} onClick={selecionarTodas}>
          {selecionandoTodas ? 'Carregando...' : 'Selecionar todas'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || value.length === 0}
          onClick={() => onChange([])}
        >
          Limpar seleção
        </Button>
        <span className="text-xs text-muted-foreground">
          {value.length === 1 ? '1 máquina selecionada' : `${value.length} máquinas selecionadas`}
        </span>
      </div>
      {erroTodas && <p className="mt-1 text-sm text-destructive">{erroTodas}</p>}
    </div>
  )
}
