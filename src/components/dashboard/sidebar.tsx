"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageSquare, Image, Settings, ChevronLeft, PanelLeftClose, PanelLeft, LogOut, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { signOut } from "@/lib/auth/actions"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { APP_NAME } from "@/lib/constants"

interface SidebarProps {
  user: {
    email?: string | null
    user_metadata?: { avatar_url?: string; full_name?: string }
  } | null
}

const navItems = [
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/images", label: "Images", icon: Image },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col border-r bg-sidebar-background transition-all duration-200",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div className={cn("flex h-14 items-center border-b px-4", collapsed && "justify-center")}>
          {!collapsed && (
            <Link href="/chat" className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>{APP_NAME}</span>
            </Link>
          )}
          {collapsed && (
            <Link href="/chat">
              <Sparkles className="h-5 w-5 text-primary" />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn("ml-auto h-8 w-8", collapsed && "ml-0")}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-muted-foreground",
                      collapsed && "justify-center px-2",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
              </Tooltip>
            )
          })}
        </nav>

        <Separator />

        <div className={cn("p-2", collapsed && "flex justify-center")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2",
                  collapsed && "w-auto px-2",
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url ?? ""} />
                  <AvatarFallback>
                    {(user?.email?.[0] ?? "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 text-left text-sm">
                    <p className="font-medium truncate">
                      {user?.user_metadata?.full_name ?? user?.email ?? "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  )
}
