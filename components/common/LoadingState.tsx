import { Skeleton } from '@/components/ui/skeleton'

interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message }: LoadingStateProps = {}) {
  return (
    <div className="space-y-4">
      {message && (
        <p className="text-sm text-muted-foreground text-center">{message}</p>
      )}
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}
