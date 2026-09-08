/**
 * Admin service — web content and announcements (SRS 2.11).
 *
 * User / staff account management moved to the Frappe-wired server actions in
 * src/app/actions/admin-accounts.ts (Story 1.14).
 */

import { mutate, nextId } from "@/lib/store";

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
