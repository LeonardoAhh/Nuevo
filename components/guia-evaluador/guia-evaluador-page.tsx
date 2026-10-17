import Link from "next/link"
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Info,
  LockKeyhole,
  Printer,
  Search,
  ShieldCheck,
  SquarePen,
  UserRoundPlus,
  Users,
} from "lucide-react"
import { GUIDE_COPY, GUIDE_STEPS, type GuideStep } from "@/components/content/desempeno/guide-steps"
import { DESEMPENO } from "@/lib/desempeno/presentation"

const FORM_STEPS = ["Datos", "Objetivos", "Responsabilidades", "Competencias", "Revisión"] as const

export function GuiaEvaluadorPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-18">
          <p className="font-mono text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Viñoplastic · Evaluación de desempeño
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Guía del evaluador
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Consulta el flujo vigente para buscar a una persona, revisar el periodo asignado,
            completar la evaluación, guardarla e imprimir el formato oficial.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Acceder al sistema
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a
              href="#flujo"
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Consultar pasos
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-border bg-muted/20" aria-labelledby="antes-heading">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="font-mono text-xs font-medium uppercase tracking-wide text-primary">Antes de iniciar</p>
              <h2 id="antes-heading" className="mt-3 text-2xl font-semibold tracking-tight">
                Acceso y alcance
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Ingresa con la cuenta que te fue asignada. El rol y los departamentos asociados a
                esa cuenta determinan qué colaboradores y pendientes puedes consultar.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard
                icon={LockKeyhole}
                title="Cuenta asignada"
                body="Las credenciales se entregan por el canal definido por Recursos Humanos. No compartas el acceso."
              />
              <InfoCard
                icon={ShieldCheck}
                title="Departamentos autorizados"
                body="Un evaluador consulta únicamente a las personas incluidas en el alcance de su perfil."
              />
            </div>
          </div>
        </section>

        <section id="flujo" className="scroll-mt-4 border-b border-border" aria-labelledby="flujo-heading">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-18">
            <div className="grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
              <div className="lg:sticky lg:top-6 lg:self-start">
                <p className="font-mono text-xs font-medium uppercase tracking-wide text-primary">Flujo vigente</p>
                <h2 id="flujo-heading" className="mt-3 text-2xl font-semibold tracking-tight">
                  {GUIDE_COPY.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {GUIDE_COPY.description}
                </p>

                <nav className="mt-6" aria-label={GUIDE_COPY.navigation}>
                  <ol className="space-y-1">
                    {GUIDE_STEPS.map((step, index) => (
                      <li key={step.id}>
                        <a
                          href={`#paso-${step.id}`}
                          className="flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <span className="font-mono text-xs tabular-nums text-primary">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          {step.title}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              </div>

              <div className="min-w-0 space-y-5">
                {GUIDE_STEPS.map((step, index) => (
                  <GuideStepSection key={step.id} step={step} index={index} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-muted/20" aria-labelledby="vistas-heading">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-18">
            <p className="font-mono text-xs font-medium uppercase tracking-wide text-primary">Navegación</p>
            <h2 id="vistas-heading" className="mt-3 text-2xl font-semibold tracking-tight">
              Vistas disponibles en Desempeño
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Evaluar y Pendientes son las vistas de trabajo disponibles para el evaluador.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <ViewCard
                icon={SquarePen}
                title={DESEMPENO.pages.evaluation.title}
                body={DESEMPENO.pages.evaluation.description}
                href={DESEMPENO.routes.home}
              />
              <ViewCard
                icon={ClipboardList}
                title={DESEMPENO.pages.pending.title}
                body="Consulta Nuevo Ingreso o Semestrales. Los resultados respetan los departamentos asignados a tu perfil."
                href={DESEMPENO.routes.pending}
              />
            </div>
          </div>
        </section>

        <section aria-labelledby="entrega-heading">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-18">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-start">
              <div>
                <p className="font-mono text-xs font-medium uppercase tracking-wide text-primary">Cierre del proceso</p>
                <h2 id="entrega-heading" className="mt-3 text-2xl font-semibold tracking-tight">
                  Impresión y entrega
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  El botón Imprimir se habilita después de guardar. El sistema abre el diálogo de
                  impresión del navegador; desde ahí puedes imprimir o guardar como PDF si el
                  dispositivo lo permite.
                </p>
              </div>

              <ol className="grid gap-3 sm:grid-cols-3">
                <DeliveryStep n="1" icon={Printer} text="Imprime el formato RG-ADM-062 o RG-ADM-063 generado por el sistema." />
                <DeliveryStep n="2" icon={ClipboardCheck} text="Recaba las firmas del colaborador y del evaluador." />
                <DeliveryStep n="3" icon={FileText} text="Entrega el documento físico al Departamento de Capacitación." />
              </ol>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-muted/20">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>Viñoplastic · Planta Querétaro</span>
          <span>Desarrollado e Implementado por LAHH</span>
        </div>
      </footer>
    </div>
  )
}

function GuideStepSection({ step, index }: { step: GuideStep; index: number }) {
  return (
    <article
      id={`paso-${step.id}`}
      className="scroll-mt-6 overflow-hidden rounded-xl border border-border bg-card"
      aria-labelledby={`paso-${step.id}-heading`}
    >
      <header className="border-b border-border px-5 py-5 sm:px-6">
        <div className="flex items-start gap-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 font-mono text-xs font-semibold text-primary">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {step.label}
            </p>
            <h3 id={`paso-${step.id}-heading`} className="mt-1 text-xl font-semibold tracking-tight">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.9fr)]">
        <div>
          <ol className="space-y-3">
            {step.instructions.map((instruction, instructionIndex) => (
              <li key={instruction} className="flex items-start gap-3 text-sm leading-relaxed">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/5 font-mono text-[10px] font-semibold text-primary">
                  {instructionIndex + 1}
                </span>
                <span>{instruction}</span>
              </li>
            ))}
          </ol>

          {step.weights && (
            <dl className="mt-5 grid gap-2 sm:grid-cols-3">
              {step.weights.map((weight) => (
                <div key={weight.label} className="rounded-md border border-border bg-muted/20 p-3">
                  <dt className="text-xs leading-snug text-muted-foreground">{weight.label}</dt>
                  <dd className="mt-1 font-mono text-lg font-semibold tabular-nums">{weight.value * 100}%</dd>
                </div>
              ))}
            </dl>
          )}

          <div role="note" className="mt-5 flex items-start gap-3 rounded-md border border-primary/20 bg-primary/5 p-3">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-muted-foreground">{step.note}</p>
          </div>
        </div>

        <StepPreview id={step.id} />
      </div>
    </article>
  )
}

function StepPreview({ id }: { id: GuideStep["id"] }) {
  if (id === "search") {
    return (
      <PreviewFrame label="Evaluar · Buscar empleado">
        <div className="space-y-3 p-4">
          <MockSearch value="3204 o nombre del colaborador" />
          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm">
            <span className="text-muted-foreground">Periodo</span>
            <span className="font-medium">Se asigna al buscar</span>
          </div>
          <p className="text-xs text-muted-foreground">La búsqueda acepta número o nombre y muestra sugerencias.</p>
        </div>
      </PreviewFrame>
    )
  }

  if (id === "period") {
    return (
      <PreviewFrame label="Periodo de evaluación">
        <div className="space-y-3 p-4">
          <MockField label="Empleado" value="Nombre y número del empleado" />
          <MockField label="Periodo asignado" value="Modalidad · periodo vigente" />
          <div className="rounded-md border border-border bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
            La modalidad y el periodo se asignan al buscar. Si ya existe una evaluación guardada, puedes abrirla para revisarla o editarla.
          </div>
        </div>
      </PreviewFrame>
    )
  }

  if (id === "evaluate") {
    return (
      <PreviewFrame label="Asistente de evaluación">
        <div className="space-y-4 p-4">
          <ol className="grid grid-cols-5 gap-1" aria-label="Cinco pasos de la evaluación">
            {FORM_STEPS.map((label, index) => (
              <li key={label} className="min-w-0">
                <div className={`flex min-h-10 items-center justify-center rounded-md border px-1 text-xs ${index === 0 ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}`}>
                  <span className="sm:hidden">{index + 1}</span>
                  <span className="hidden truncate sm:inline">{label}</span>
                </div>
              </li>
            ))}
          </ol>
          <MockField label="Evaluador" value="Selecciona al responsable" />
          <div className="grid gap-2 sm:grid-cols-2">
            <MockRule text="Objetivos y responsabilidades: 0 a 100 o No aplica." />
            <MockRule text="Competencias: selecciona una respuesta de 0 a 4." />
          </div>
        </div>
      </PreviewFrame>
    )
  }

  if (id === "save") {
    return (
      <PreviewFrame label="Revisión y compromisos">
        <div className="space-y-3 p-4">
          <MockField label="Compromisos / Acuerdos" value="Campo obligatorio cuando el resultado es menor a 80%" multiline />
          <MockField label="Fecha de revisión" value="dd/mm/aaaa" />
          <MockField label="Observaciones" value="Información adicional" />
          <div className="flex justify-end">
            <div className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
              <Check className="size-4" aria-hidden="true" />
              Guardar evaluación
            </div>
          </div>
        </div>
      </PreviewFrame>
    )
  }

  return (
    <PreviewFrame label="Evaluación guardada">
      <div className="space-y-4 p-4">
        <div className="flex items-start gap-3 rounded-md border border-primary/30 bg-primary/5 p-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold">Evaluación guardada</p>
            <p className="mt-1 text-xs text-muted-foreground">El formato ya está disponible para imprimir.</p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium">
            <UserRoundPlus className="size-4" aria-hidden="true" />
            Evaluar otra persona
          </div>
          <div className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">
            <Printer className="size-4" aria-hidden="true" />
            Imprimir
          </div>
        </div>
      </div>
    </PreviewFrame>
  )
}

function PreviewFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <figure className="overflow-hidden rounded-lg border border-border bg-muted/10">
      <figcaption className="border-b border-border px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </figcaption>
      {children}
    </figure>
  )
}

function InfoCard({ icon: Icon, title, body }: { icon: typeof LockKeyhole; title: string; body: string }) {
  return (
    <article className="rounded-xl border border-border bg-card p-5">
      <Icon className="size-5 text-primary" aria-hidden="true" />
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </article>
  )
}

function ViewCard({ icon: Icon, title, body, href }: { icon: typeof Users; title: string; body: string; href: string }) {
  return (
    <article className="flex flex-col rounded-xl border border-border bg-card p-5">
      <Icon className="size-5 text-primary" aria-hidden="true" />
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
      <Link href={href} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        Abrir {title.toLowerCase()}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </article>
  )
}

function DeliveryStep({ n, icon: Icon, text }: { n: string; icon: typeof Printer; text: string }) {
  return (
    <li className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-semibold text-primary">{n.padStart(2, "0")}</span>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="mt-3 text-sm leading-relaxed">{text}</p>
    </li>
  )
}

function MockSearch({ value }: { value: string }) {
  return (
    <div className="flex min-h-11 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm text-muted-foreground">
      <Search className="size-4 shrink-0" aria-hidden="true" />
      {value}
    </div>
  )
}

function MockField({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <p className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className={`rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground ${multiline ? "min-h-16" : "min-h-9"}`}>
        {value}
      </div>
    </div>
  )
}

function MockRule({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3 text-xs leading-relaxed text-muted-foreground">
      {text}
    </div>
  )
}
