import { Moon, Sun } from "lucide-react"
import { Button } from "./Button"
import { useEffect, useState } from "react"
import { useTheme } from "./themeProvider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10">
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    )
  }

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light"

    if (!document.startViewTransition) {
      setTheme(nextTheme)
      return
    }

    document.startViewTransition(() => {
      setTheme(nextTheme)
    })
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl h-10 w-10">
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}