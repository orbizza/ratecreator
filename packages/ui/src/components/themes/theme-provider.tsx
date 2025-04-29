import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps as NextThemeProviderProps } from "next-themes";

/**
 * ThemeProvider Component
 *
 * A wrapper component that provides theme context to the application.
 * It uses next-themes to manage theme state and persistence.
 *
 * @component
 * @param {NextThemeProviderProps} props - Theme provider props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} A theme provider component
 */
export function ThemeProvider({ children, ...props }: NextThemeProviderProps) {
  return (
    <NextThemesProvider
      // Use class attribute for theme switching
      attribute="class"
      // Default to system theme
      defaultTheme="system"
      // Enable system theme detection
      enableSystem
      // Disable transition animation when changing themes
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
