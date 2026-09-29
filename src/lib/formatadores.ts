export const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export const horasFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2,
})
