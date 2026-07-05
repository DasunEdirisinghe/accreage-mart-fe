"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Leaf, Menu, LogOut, LayoutDashboard, UserRound } from "lucide-react";

import { cn, initials } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { useDB } from "@/hooks/use-db";
import { markNotificationsRead } from "@/lib/services/engagement";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Role } from "@/lib/types";

const NAV = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/auctions", label: "Auctions" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const DASHBOARD_HOME: Record<string, string> = {
  buyer: "/buyer",
  seller: "/seller",
  staff: "/admin",
  admin: "/admin",
};

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loginAs, logout } = useAuth();
  const db = useDB();

  const unread = user
    ? db.notifications.filter((n) => n.userId === user.id && !n.read)
    : [];

  const switchRole = (role: Exclude<Role, "public">) => {
    loginAs(role);
    router.push(DASHBOARD_HOME[role]);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="hidden text-lg font-bold tracking-tight sm:inline">
              Accreage <span className="text-primary">Mart</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground",
                  pathname.startsWith(item.href) && "bg-secondary text-secondary-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unread.length > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                        {unread.length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    Notifications
                    {unread.length > 0 && (
                      <button
                        className="text-xs font-normal text-primary hover:underline"
                        onClick={() => markNotificationsRead(user.id)}
                      >
                        Mark all read
                      </button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {db.notifications.filter((n) => n.userId === user.id).length === 0 && (
                    <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                      No notifications yet.
                    </p>
                  )}
                  {db.notifications
                    .filter((n) => n.userId === user.id)
                    .slice(0, 6)
                    .map((n) => (
                      <div key={n.id} className="flex items-start gap-2 px-2 py-2 text-sm">
                        <span
                          className={cn(
                            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                            n.read ? "bg-muted" : "bg-accent"
                          )}
                        />
                        <p className={cn("leading-snug", n.read && "text-muted-foreground")}>
                          {n.message}
                        </p>
                      </div>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* user menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full outline-none ring-ring focus-visible:ring-2">
                    <Avatar>
                      <AvatarFallback className={cn(user.avatarColor, "text-white")}>
                        {initials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user.name}</span>
                      <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push(DASHBOARD_HOME[user.role] ?? "/")}>
                    <LayoutDashboard /> My dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Demo: switch role
                  </DropdownMenuLabel>
                  {(["buyer", "seller", "staff", "admin"] as const).map((r) => (
                    <DropdownMenuItem key={r} onClick={() => switchRole(r)}>
                      <UserRound />
                      <span className="capitalize">{r}</span>
                      {user.role === r && (
                        <Badge variant="secondary" className="ml-auto">
                          current
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      router.push("/");
                    }}
                  >
                    <LogOut /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Register</Link>
              </Button>
            </div>
          )}

          {/* mobile nav */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-primary" /> Accreage Mart
              </SheetTitle>
              <nav className="mt-6 flex flex-col gap-1">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary"
                  >
                    {item.label}
                  </Link>
                ))}
                {!user && (
                  <>
                    <Link href="/login" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary">
                      Sign in
                    </Link>
                    <Link href="/register" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary">
                      Register
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
