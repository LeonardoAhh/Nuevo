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
  page: "flex min-h-dvh items-center justify-center bg-background px-4 py-8 text-foreground sm:px-6 safe-bottom-content",
  container: "w-full max-w-md",
  formRegion: "min-w-0 rounded-xl border border-border bg-card p-6 text-card-foreground sm:p-8",
  form: "w-full space-y-7",
  heading: "text-xl font-semibold leading-7 tracking-tight text-foreground",
  description: "text-sm leading-relaxed text-muted-foreground",
  fields: "space-y-4",
  field: "space-y-2",
  input: "h-11",
  passwordInput: "h-11 pr-12",
  passwordToggle: "absolute inset-y-0 right-0 size-11 text-muted-foreground hover:text-foreground",
  submit: "mt-2 h-11 w-full",
} as const
