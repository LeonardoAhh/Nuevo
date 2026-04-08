import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Capacitación VIÑOPLASTIC",
    short_name: "Capacitación",
    description: "Sistema de gestión de capacitación y nuevo ingreso",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Capacitación",
        url: "/capacitacion",
        description: "Gestión de cursos y empleados",
      },
      {
        name: "Nuevo Ingreso",
        url: "/nuevo-ingreso",
        description: "Seguimiento de personal de nuevo ingreso",
      },
    ],
  }
}
