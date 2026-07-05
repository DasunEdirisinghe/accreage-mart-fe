/**
 * Admin/staff service, user management, web content, announcements
 * (SRS 2.2, 2.3, 2.11). WIRING LATER: Frappe User + custom DocTypes.
 */

import { mutate, nextId } from "@/lib/store";
import type { Role, UserStatus } from "@/lib/types";

export function setUserStatus(userId: string, status: UserStatus): void {
  mutate((db) => {
    const u = db.users.find((x) => x.id === userId);
    if (u) u.status = status;
  });
}

export function addStaffUser(name: string, email: string, role: Extract<Role, "staff" | "admin">): void {
  mutate((db) => {
    db.users.push({
      id: nextId("u"),
      name,
      email,
      phone: "+94 70 000 0000",
      role,
      status: "active",
      avatarColor: "bg-cyan-700",
      createdAt: new Date().toISOString(),
    });
  });
}

export function saveContentPage(id: string | null, title: string, body: string, published: boolean): void {
  mutate((db) => {
    if (id) {
      const p = db.contentPages.find((x) => x.id === id);
      if (p) {
        p.title = title;
        p.body = body;
        p.published = published;
        p.updatedAt = new Date().toISOString();
      }
    } else {
      db.contentPages.push({
        id: nextId("cp"),
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        body,
        published,
        updatedAt: new Date().toISOString(),
      });
    }
  });
}

export function addAnnouncement(title: string, body: string): void {
  mutate((db) => {
    db.announcements.unshift({
      id: nextId("an"),
      title,
      body,
      createdAt: new Date().toISOString(),
    });
  });
}
