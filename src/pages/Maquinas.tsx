export function Maquinas() {
  return <PagePlaceholder title="Máquinas" />
}

function PagePlaceholder({ title }: { title: string }) {
  return <section className="mx-auto max-w-6xl px-6 py-10"><p className="text-sm font-medium text-slate-500">Módulo</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h2><p className="mt-3 text-slate-500">Em construção</p></section>
}
