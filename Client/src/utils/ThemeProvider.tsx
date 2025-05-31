import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"
type ResolvedTheme = "dark" | "light"

type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: Theme
    storageKey?: string
}

type ThemeProviderState = {
    theme: Theme
    setTheme: (theme: Theme) => void
    resolvedTheme: ResolvedTheme
}

const getSystemTheme = (): ResolvedTheme =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"

const initialState: ThemeProviderState = {
    theme: "system",
    setTheme: () => null,
    resolvedTheme: getSystemTheme(),
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "vite-ui-theme",
    ...props
}: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    )
    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(getSystemTheme)

    const applyTheme = (newTheme: Theme) => {
        const root = window.document.documentElement
        root.classList.remove("light", "dark")

        const applied = newTheme === "system" ? getSystemTheme() : newTheme
        root.classList.add(applied)
        setResolvedTheme(applied)
    }

    useEffect(() => {
        applyTheme(theme)

        const media = window.matchMedia("(prefers-color-scheme: dark)")
        const handleSystemChange = () => {
            if (theme === "system") {
                applyTheme("system")
            }
        }

        media.addEventListener("change", handleSystemChange)
        return () => media.removeEventListener("change", handleSystemChange)
    }, [theme])

    const setTheme = (newTheme: Theme) => {
        localStorage.setItem(storageKey, newTheme)
        setThemeState(newTheme)
    }

    const value = {
        theme,
        setTheme,
        resolvedTheme,
    }

    return (
        <ThemeProviderContext.Provider value={value} {...props}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider")
    }
    return context
}
