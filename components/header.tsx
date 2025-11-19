import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export function Header() {
  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border transition-colors duration-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground transition-colors duration-200 hover:opacity-80 cursor-pointer">
                Map Studio
              </h1>
            </Link>
            <p className="text-sm text-muted-foreground mt-1.5 transition-colors duration-200">
              A mapping tool built for designers. Import and geocode data, map values to symbols or choropleths, and
              export directly to Figma.
            </p>
            <p className="text-xs text-muted-foreground mt-1 transition-colors duration-200">
              Brought to you by The DataFace.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
