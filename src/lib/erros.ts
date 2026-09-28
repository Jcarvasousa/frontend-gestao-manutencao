import axios from 'axios'

export function mensagemDeErro(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ mensagem?: string }>(error)) {
    const mensagem = error.response?.data?.mensagem
    if (typeof mensagem === 'string' && mensagem.trim() !== '') return mensagem
  }
  return fallback
}
