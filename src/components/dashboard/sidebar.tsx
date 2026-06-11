"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageSquare, Image, Settings, PanelLeftClose, PanelLeft, LogOut, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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
      <motion.aside
        animate={{ width: collapsed ? 68 : 256 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="flex flex-col border-r bg-sidebar-background overflow-hidden relative"
      >
        <div className={cn("flex h-14 items-center border-b border-sidebar-border px-3 shrink-0", collapsed && "justify-center px-0")}>
          <Link href="/chat" className={cn("flex items-center gap-2.5 font-semibold", collapsed && "justify-center")}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden whitespace-nowrap text-sm"
                >
                  {APP_NAME}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className={cn("ml-auto h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground", collapsed && "ml-0")}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-2.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent",
                      collapsed && "justify-center px-2",
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-xl bg-sidebar-accent"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-3">
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200", isActive && "bg-primary/10")}>
                        <Icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive && "text-primary")} />
                      </div>
                      <AnimatePresence initial={false}>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.12 }}
                            className="overflow-hidden whitespace-nowrap"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                  </Link>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
              </Tooltip>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border p-2.5 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 h-auto hover:bg-sidebar-accent transition-all duration-200",
                  collapsed && "w-auto px-2 justify-center",
                )}
              >
                <Avatar className="h-8 w-8 shrink-0 ring-2 ring-sidebar-border">
                  <AvatarImage src={user?.user_metadata?.avatar_url ?? ""} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {(user?.email?.[0] ?? "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="flex-1 text-left text-sm overflow-hidden"
                    >
                      <p className="font-medium truncate text-sidebar-foreground">
                        {user?.user_metadata?.full_name ?? user?.email ?? "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuItem asChild className="rounded-lg">
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive rounded-lg">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}
