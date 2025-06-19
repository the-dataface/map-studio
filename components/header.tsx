import { ThemeToggle } from "@/components/theme-toggle"

export function Header() {
  return (
    <header className="bg-white dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200">
              Map Studio
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 transition-colors duration-200">
              A mapping tool built for designers. Import and geocode data, map values to symbols or choropleths, and
              export directly to Figma.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-200">
              Brought to you by The DataFace.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
