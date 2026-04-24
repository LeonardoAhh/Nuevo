"use client"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PaginationBarProps {
  currentPage: number
  totalPages: number
  onPageChange: (p: number) => void
}

export function PaginationBar({ currentPage, totalPages, onPageChange }: PaginationBarProps) {
  const safePage = Math.min(currentPage, totalPages)
  return (
    <nav
      aria-label="Paginación"
      className="flex items-center justify-between mb-3"
    >
      <span className="text-sm text-muted-foreground" aria-live="polite">
        Página {safePage} de {totalPages}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="h-10 w-10 p-0 sm:h-8 sm:w-8"
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
          .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
            if (idx > 0 && p - arr[idx - 1] > 1) acc.push('ellipsis')
            acc.push(p)
            return acc
          }, [])
          .map((item, idx) =>
            item === 'ellipsis'
              ? <span key={`e${idx}`} className="px-1 text-muted-foreground text-sm" aria-hidden="true">…</span>
              : (
                <Button
                  key={item}
                  variant={item === safePage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(item)}
                  className="h-10 w-10 p-0 text-xs sm:h-8 sm:w-8"
                  aria-label={`Ir a la página ${item}`}
                  aria-current={item === safePage ? 'page' : undefined}
                >
                  {item}
                </Button>
              )
          )}
        <Button
          variant="outline"
          size="sm"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="h-10 w-10 p-0 sm:h-8 sm:w-8"
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  )
}
