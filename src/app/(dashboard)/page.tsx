import DashboardShell from "@/components/dashboard/shell"

export default function DashboardPage() {
  return (
    <DashboardShell>
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Welcome to Nexus AI</h1>
          <p className="text-muted-foreground">Select a feature from the sidebar to get started.</p>
        </div>
      </div>
    </DashboardShell>
  )
}
