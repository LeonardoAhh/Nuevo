import coreWebVitals from "eslint-config-next/core-web-vitals"
import typescript from "eslint-config-next/typescript"

const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "out/**"],
  },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // Legacy effects across the codebase still call setState synchronously
      // inside effects. New code must derive state during render instead
      // (see components/sidebar.tsx / desempeno-pendientes.tsx for examples).
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]

export default eslintConfig
