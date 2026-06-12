"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-2xl font-bold tracking-tight">Critical Error</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              {error.message || "A critical error occurred. Please try again."}
            </p>
          </div>
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
