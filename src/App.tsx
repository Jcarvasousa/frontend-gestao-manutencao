import { lazy, Suspense, useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import {
  BarChart3,
  Box,
  ClipboardList,
  Cog,
  FileText,
  Factory,
  LayoutDashboard,
  LogOut,
  Menu,
  ShoppingCart,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'

const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const Maquinas = lazy(() => import('@/pages/Maquinas').then((m) => ({ default: m.Maquinas })))
const Setores = lazy(() => import('@/pages/Setores').then((m) => ({ default: m.Setores })))
const Pecas = lazy(() => import('@/pages/Pecas').then((m) => ({ default: m.Pecas })))
const Manutencoes = lazy(() => import('@/pages/Manutencoes').then((m) => ({ default: m.Manutencoes })))
const Tecnicos = lazy(() => import('@/pages/Tecnicos').then((m) => ({ default: m.Tecnicos })))
const Estoque = lazy(() => import('@/pages/Estoque').then((m) => ({ default: m.Estoque })))
const Compras = lazy(() => import('@/pages/Compras').then((m) => ({ default: m.Compras })))
const Relatorios = lazy(() => import('@/pages/Relatorios').then((m) => ({ default: m.Relatorios })))
const OrcamentosMensais = lazy(() =>
  import('@/pages/OrcamentosMensais').then((m) => ({
    default: m.OrcamentosMensais,
  })),
)
const Login = lazy(() => import('@/pages/Login').then((m) => ({ default: m.Login })))

const navigation = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Máquinas', path: '/maquinas', icon: Cog },
  { label: 'Setores', path: '/setores', icon: Factory },
  { label: 'Peças', path: '/pecas', icon: Box },
  { label: 'Manutenções', path: '/manutencoes', icon: ClipboardList },
  { label: 'Técnicos', path: '/tecnicos', icon: Users },
  { label: 'Movimentações', path: '/estoque', icon: BarChart3 },
  { label: 'Compras', path: '/compras', icon: ShoppingCart },
  { label: 'Orçamentos', path: '/orcamentos', icon: Wallet },
  { label: 'Relatórios', path: '/relatorios', icon: FileText },
]

function Marca() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="var(--primary-foreground)" strokeWidth="3">
          <circle cx="12" cy="12" r="6.5" />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-foreground">GestãoManutenção</span>
    </div>
  )
}

function PaginaCarregando() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-4 px-6 py-10" role="status" aria-label="Carregando página">
      <div className="h-8 w-48 rounded-lg bg-surface" />
      <div className="h-4 w-72 rounded-lg bg-surface" />
      <div className="grid gap-4 pt-4 sm:grid-cols-2">
        <div className="h-32 rounded-[14px] bg-card" />
        <div className="h-32 rounded-[14px] bg-card" />
      </div>
      <div className="h-64 rounded-[14px] bg-card" />
    </div>
  )
}

function AppLayout() {
  const { logout } = useAuth()
  const location = useLocation()
  // A gaveta guarda a rota em que foi aberta: ao navegar, deixa de estar aberta.
  const [caminhoAberto, setCaminhoAberto] = useState<string | null>(null)
  const menuAberto = caminhoAberto === location.pathname
  const botaoMenuRef = useRef<HTMLButtonElement>(null)
  const botaoFecharRef = useRef<HTMLButtonElement>(null)
  const gavetaRef = useRef<HTMLElement>(null)

  const fechar = useCallback(() => {
    setCaminhoAberto(null)
    botaoMenuRef.current?.focus()
  }, [])

  // Foco no botão de fechar ao abrir; Esc fecha.
  useEffect(() => {
    if (!menuAberto) return
    botaoFecharRef.current?.focus()
    function aoPressionar(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') fechar()
    }
    document.addEventListener('keydown', aoPressionar)
    return () => document.removeEventListener('keydown', aoPressionar)
  }, [menuAberto, fechar])

  // Trava a rolagem do fundo enquanto a gaveta está aberta.
  useEffect(() => {
    if (!menuAberto) return
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = anterior
    }
  }, [menuAberto])

  // Se a janela crescer até o desktop com a gaveta aberta, encerra o estado aberto.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    function aoMudar(event: MediaQueryListEvent) {
      if (event.matches) setCaminhoAberto(null)
    }
    mq.addEventListener('change', aoMudar)
    return () => mq.removeEventListener('change', aoMudar)
  }, [])

  // Mantém o foco dentro da gaveta enquanto aberta (Tab / Shift+Tab).
  function prenderFoco(event: KeyboardEvent<HTMLElement>) {
    if (!menuAberto || event.key !== 'Tab') return
    const focaveis = gavetaRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
    if (!focaveis || focaveis.length === 0) return
    const primeiro = focaveis[0]
    const ultimo = focaveis[focaveis.length - 1]
    if (event.shiftKey && document.activeElement === primeiro) {
      event.preventDefault()
      ultimo.focus()
    } else if (!event.shiftKey && document.activeElement === ultimo) {
      event.preventDefault()
      primeiro.focus()
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-sidebar-border bg-sidebar px-2 lg:hidden">
        <button
          ref={botaoMenuRef}
          type="button"
          onClick={() => setCaminhoAberto(location.pathname)}
          aria-label="Abrir menu"
          aria-expanded={menuAberto}
          aria-controls="navegacao-lateral"
          className="flex size-11 items-center justify-center rounded-lg text-foreground outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Menu size={22} strokeWidth={1.8} />
        </button>
        <Marca />
      </header>

      {menuAberto && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={fechar} aria-hidden="true" />}

      <aside
        id="navegacao-lateral"
        ref={gavetaRef}
        onKeyDown={prenderFoco}
        aria-label="Menu lateral"
        className={`fixed inset-y-0 left-0 z-50 flex w-[232px] flex-col border-r border-sidebar-border bg-sidebar transition-[transform,visibility] duration-200 lg:visible lg:translate-x-0 ${menuAberto ? 'translate-x-0' : 'max-lg:invisible max-lg:-translate-x-full'}`}
      >
        <div className="flex h-14 items-center justify-between px-4 lg:h-16">
          <Marca />
          <button
            ref={botaoFecharRef}
            type="button"
            onClick={fechar}
            aria-label="Fechar menu"
            className="flex size-11 items-center justify-center rounded-lg text-nav-foreground outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          >
            <X size={20} strokeWidth={1.8} />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2" aria-label="Navegação principal">
          {navigation.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${isActive ? 'bg-surface text-foreground' : 'text-nav-foreground hover:bg-surface/60 hover:text-foreground'}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} strokeWidth={1.8} className={isActive ? 'text-primary' : undefined} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-3 border-t border-sidebar-border p-3">
          <div className="rounded-lg border border-border bg-card p-3 text-xs leading-relaxed">
            <p className="font-medium text-foreground">Ambiente de demonstração</p>
            <p className="mt-1 text-muted-foreground">Os dados são reiniciados todo dia às 2h (Brasília).</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-nav-foreground outline-none transition-colors hover:bg-surface/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LogOut size={18} strokeWidth={1.8} />
            Sair
          </button>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-[232px]">
        <ErrorBoundary key={location.pathname}>
          <Suspense fallback={<PaginaCarregando />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/maquinas" element={<Maquinas />} />
              <Route path="/setores" element={<Setores />} />
              <Route path="/pecas" element={<Pecas />} />
              <Route path="/manutencoes" element={<Manutencoes />} />
              <Route path="/tecnicos" element={<Tecnicos />} />
              <Route path="/estoque" element={<Estoque />} />
              <Route path="/compras" element={<Compras />} />
              <Route path="/orcamentos" element={<OrcamentosMensais />} />
              <Route path="/relatorios" element={<Relatorios />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  )
}

function App() {
  const location = useLocation()

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <ErrorBoundary key={location.pathname}>
            <Suspense fallback={<PaginaCarregando />}>
              <Login />
            </Suspense>
          </ErrorBoundary>
        }
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
