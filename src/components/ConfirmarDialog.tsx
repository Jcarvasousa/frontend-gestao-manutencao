import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ConfirmarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  titulo: string
  descricao: string
  rotuloConfirmar: string
  rotuloPendente: string
  rotuloVoltar?: string
  pendente: boolean
  erro: string | null
  onConfirmar: () => void
}

export function ConfirmarDialog({
  open,
  onOpenChange,
  titulo,
  descricao,
  rotuloConfirmar,
  rotuloPendente,
  rotuloVoltar = 'Voltar',
  pendente,
  erro,
  onConfirmar,
}: ConfirmarDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>

        {erro && (
          <p className="text-sm text-destructive" role="alert">
            {erro}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pendente}>
            {rotuloVoltar}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirmar} disabled={pendente}>
            {pendente ? rotuloPendente : rotuloConfirmar}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
