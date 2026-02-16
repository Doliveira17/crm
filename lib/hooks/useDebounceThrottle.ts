import React from 'react'

// Debounce hook para otimizar atualizações em tempo real
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// Throttle hook para limitar atualizações frequentes
export function useThrottle<T>(value: T, interval: number = 500): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value)
  const lastUpdated = React.useRef<number>(0)

  React.useEffect(() => {
    const now = Date.now()

    if (lastUpdated.current === 0) {
      lastUpdated.current = now
    }

    const elapsed = now - lastUpdated.current

    if (elapsed >= interval) {
      lastUpdated.current = now
      setThrottledValue(value)
    } else {
      const timer = setTimeout(() => {
        lastUpdated.current = Date.now()
        setThrottledValue(value)
      }, interval - elapsed)

      return () => clearTimeout(timer)
    }
  }, [value, interval])

  return throttledValue
}
