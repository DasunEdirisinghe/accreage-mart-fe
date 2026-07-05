"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Leaf, PanelLeft, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SiteHeader } from "@/components/layout/site-header";
import type { Role } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface DashboardShellProps {
  allowedRoles: Role[];
  title: string;
  nav: NavItem[];
  children: React.ReactNode;
}

/**
 * Shared sidebar shell for buyer / seller / admin areas.
 * Guards by role: if the current mock user doesn't match, offers a
 * one-click role switch (demo convenience instead of a hard redirect).
 */
export function DashboardShell({ allowedRoles, title, nav, children }: DashboardShellProps) {
  const pathname = usePathname();
  const { user, loginAs } = useAuth();
  const router = useRouter();

  if (!user || !allowedRoles.includes(user.role)) {
    const target = allowedRoles[0] as Exclude<Role, "public">;
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="container flex flex-1 items-center justify-center py-16">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle>{title} access</CardTitle>
              <CardDescription>
                {user
                  ? `You are signed in as a ${user.role}. This area is for ${allowedRoles.join(" / ")} accounts.`
                  : `Sign in to access the ${title.toLowerCase()}. In this demo you can enter with one click.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button onClick={() => loginAs(target === "staff" ? "admin" : target)}>
                Continue as demo {target === "staff" ? "admin" : target}
              </Button>
              <Button variant="outline" onClick={() => router.push("/")}>
                Back to home
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const sidebar = (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => {
        const active =
          item.href === nav[0].href ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground",
              active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="container flex flex-1 gap-6 py-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          {sidebar}
        </aside>
        <div className="min-w-0 flex-1">
          <div className="mb-4 lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <PanelLeft className="h-4 w-4" /> {title} menu
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <SheetTitle className="mb-4 flex items-center gap-2 text-base">
                  <Leaf className="h-4 w-4 text-primary" /> {title}
                </SheetTitle>
                {sidebar}
              </SheetContent>
            </Sheet>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
