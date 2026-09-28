/** Shared copy for the login screen and its accessible status messages. */
export const LOGIN = {
  brand: "Capacitación",
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
  error: "No se pudo iniciar sesión. Revisa tus datos e inténtalo de nuevo.",
  retry: "Volver a intentar",
} as const

/** Layout and typography use the system spacing scale and semantic theme tokens. */
export const loginStyles = {
  page: "flex min-h-dvh flex-col items-center justify-center bg-muted/30 px-4 py-8 text-foreground sm:px-6 safe-bottom-content",
  container: "my-auto w-full max-w-md space-y-6",
  brand: "flex items-center justify-center gap-2 text-sm font-semibold tracking-tight",
  brandIcon: "flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground",
  formRegion: "min-w-0 rounded-xl border bg-card p-6 text-card-foreground shadow-sm sm:p-8",
  form: "w-full space-y-6",
  heading: "text-2xl font-semibold leading-tight tracking-tight text-foreground",
  description: "text-sm leading-relaxed text-muted-foreground",
  fields: "space-y-5",
  field: "space-y-2",
  input: "h-11",
  passwordInput: "h-11 pr-12",
  passwordToggle: "absolute inset-y-0 right-0 size-11 text-muted-foreground hover:text-foreground",
  submit: "h-11 w-full",
} as const
