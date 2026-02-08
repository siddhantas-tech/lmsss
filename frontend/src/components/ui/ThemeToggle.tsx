import { Moon, Sun } from "lucide-react"
import { Button } from "./Button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "light"
    }
    return "light"
  })

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    localStorage.setItem("theme", theme)
  }, [theme])

  const toggleTheme = () => {
    if (!document.startViewTransition) {
      setTheme(theme === "light" ? "dark" : "light")
      return
    }

    document.startViewTransition(() => {
      setTheme(theme === "light" ? "dark" : "light")
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