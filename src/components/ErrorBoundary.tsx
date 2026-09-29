import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  erro: Error | null
}

// Captura erros de renderização e falhas de carregamento de chunk (versão nova com a aba aberta).
// O reinício por rota é feito por quem usa, com key={location.pathname}.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { erro: null }

  static getDerivedStateFromError(erro: Error): State {
    return { erro }
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error('Erro ao renderizar a tela:', erro, info.componentStack)
  }

  render() {
    if (!this.state.erro) return this.props.children

    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center" role="alert">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Não foi possível carregar esta tela</h2>
        <p className="mt-2 text-sm text-muted-foreground">Pode ser uma versão nova do sistema. Recarregue a página.</p>
        <Button className="mt-5" onClick={() => window.location.reload()}>
          Recarregar página
        </Button>
      </div>
    )
  }
}
