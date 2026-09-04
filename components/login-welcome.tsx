import { LOGIN, loginStyles } from "@/lib/login/presentation"

export default function LoginWelcome() {
  return (
    <header className="space-y-3">
      <h1 id="login-title" className={loginStyles.heading}>
        {LOGIN.title}
      </h1>
      <p id="login-description" className={loginStyles.description}>
        {LOGIN.description}
      </p>
    </header>
  )
}
