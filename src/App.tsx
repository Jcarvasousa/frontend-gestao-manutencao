import { BarChart3, Box, ClipboardList, Cog, FileText, ShoppingCart, Wallet } from 'lucide-react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { Maquinas } from '@/pages/Maquinas'
import { Pecas } from '@/pages/Pecas'
import { Manutencoes } from '@/pages/Manutencoes'
import { Estoque } from '@/pages/Estoque'
import { Compras } from '@/pages/Compras'
import { Relatorios } from '@/pages/Relatorios'
import { OrcamentosMensais } from '@/pages/OrcamentosMensais'

const navigation = [
  { label: 'Máquinas', path: '/maquinas', icon: Cog },
  { label: 'Peças', path: '/pecas', icon: Box },
  { label: 'Manutenções', path: '/manutencoes', icon: ClipboardList },
  { label: 'Movimentações', path: '/estoque', icon: BarChart3 },
  { label: 'Compras', path: '/compras', icon: ShoppingCart },
  { label: 'Orçamentos', path: '/orcamentos', icon: Wallet },
  { label: 'Relatórios', path: '/relatorios', icon: FileText },
]

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white md:block">
        <div className="border-b border-slate-200 px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Gestão</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">Manutenção</h1>
        </div>
        <nav className="space-y-1 p-4" aria-label="Navegação principal">
          {navigation.map(({ label, path, icon: Icon }) => (
            <NavLink key={path} to={path} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`}>
              <Icon size={18} strokeWidth={1.8} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="min-h-screen md:ml-64">
        <div className="border-b border-slate-200 bg-white px-6 py-4 md:hidden">
          <p className="font-semibold">Gestão de Manutenção</p>
          <nav className="mt-3 flex gap-2 overflow-x-auto" aria-label="Navegação principal">
            {navigation.map(({ label, path }) => <NavLink key={path} to={path} className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">{label}</NavLink>)}
          </nav>
        </div>
        <Routes>
          <Route path="/" element={<Maquinas />} />
          <Route path="/maquinas" element={<Maquinas />} />
          <Route path="/pecas" element={<Pecas />} />
          <Route path="/manutencoes" element={<Manutencoes />} />
          <Route path="/estoque" element={<Estoque />} />
          <Route path="/compras" element={<Compras />} />
          <Route path="/orcamentos" element={<OrcamentosMensais />} />
          <Route path="/relatorios" element={<Relatorios />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
