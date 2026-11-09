/** Shared copy for the login screen and its accessible status messages. */
export const LOGIN = {
  title: "Inicia sesión",
  description: "Accede con tu cuenta de Capacitación.",
  pageTitle: "Iniciar sesión",
  pageDescription: "Accede al sistema de Capacitación.",
  loading: "Cargando…",
  email: "Correo electrónico",
  emailPlaceholder: "Ingresa tu correo electrónico",
  password: "Contraseña",
  passwordPlaceholder: "Ingresa tu contraseña",
  showPassword: "Mostrar contraseña",
  hidePassword: "Ocultar contraseña",
  submit: "Iniciar sesión",
  submitting: "Iniciando sesión…",
  success: "¡Bienvenido!",
  error: "Correo o contraseña incorrectos.",
  requiredFields: "Ingresa tu correo y contraseña.",
  invalidEmail: "Ingresa un correo electrónico válido.",
  retry: "Volver a intentar",
} as const

/** Layout and typography use the system spacing scale and semantic theme tokens. */
export const loginStyles = {
  page: "min-h-dvh bg-background text-foreground safe-bottom-content sm:h-dvh sm:min-h-0 sm:flex-row sm:items-stretch sm:px-[var(--workspace-inset)] md:px-0",
  container: "grid min-h-dvh w-full flex-1 grid-cols-1 bg-card sm:my-[var(--workspace-inset)] sm:min-h-0 sm:grid-cols-2 sm:rounded-xl sm:border sm:border-border md:my-0",
  formRegion: "flex min-h-dvh min-w-0 items-center justify-center px-4 py-8 text-card-foreground sm:min-h-0 sm:px-6 md:px-8 lg:px-12",
  form: "mx-auto w-full max-w-md space-y-7",
  heading: "text-xl font-semibold leading-7 tracking-[-0.4px] text-foreground",
  description: "text-sm leading-relaxed text-muted-foreground",
  fields: "space-y-4",
  field: "space-y-2",
  input: "h-11",
  passwordInput: "h-11 pr-12",
  passwordToggle: "absolute inset-y-0 right-0 size-11 text-muted-foreground hover:text-foreground",
  submit: "mt-2 h-11 w-full",
} as const
