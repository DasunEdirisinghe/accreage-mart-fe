"use client";

import * as React from "react";
import { FileText, Megaphone, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

import { useDB } from "@/hooks/use-db";
import { saveContentPage, addAnnouncement } from "@/lib/services/admin";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

export default function WebContentPage() {
  const db = useDB();
  const [editId, setEditId] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [published, setPublished] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const [annTitle, setAnnTitle] = React.useState("");
  const [annBody, setAnnBody] = React.useState("");

  const openEditor = (id: string | null) => {
    const page = id ? db.contentPages.find((p) => p.id === id) : null;
    setEditId(id);
    setTitle(page?.title ?? "");
    setBody(page?.body ?? "");
    setPublished(page?.published ?? true);
    setDialogOpen(true);
  };

  const save = () => {
    saveContentPage(editId, title, body, published);
    toast.success(editId ? "Page updated" : "Page created");
    setDialogOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Web content management"
        description="Manage marketplace guidelines, policies and announcements (SRS 2.11)."
      />

      <Tabs defaultValue="pages">
        <TabsList>
          <TabsTrigger value="pages">Pages & policies</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openEditor(null)}>
                  <Plus className="h-4 w-4" /> New page
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>{editId ? "Edit page" : "New page"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea rows={7} value={body} onChange={(e) => setBody(e.target.value)} />
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <Label>Published</Label>
                    <Switch checked={published} onCheckedChange={setPublished} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={save} disabled={!title.trim()}>Save page</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {db.contentPages.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center gap-4 p-5">
                <FileText className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{p.title}</p>
                  <p className="truncate text-sm text-muted-foreground">{p.body}</p>
                  <p className="text-xs text-muted-foreground">/{p.slug} · updated {formatDate(p.updatedAt)}</p>
                </div>
                <Badge variant={p.published ? "success" : "muted"}>{p.published ? "published" : "draft"}</Badge>
                <Button size="sm" variant="outline" onClick={() => openEditor(p.id)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="announcements" className="mt-4 space-y-4">
          <Card>
            <CardContent className="space-y-3 p-5">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Megaphone className="h-4 w-4 text-primary" /> Post announcement
              </p>
              <Input placeholder="Title" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} />
              <Textarea rows={2} placeholder="Announcement text (shown on the landing page)" value={annBody} onChange={(e) => setAnnBody(e.target.value)} />
              <Button
                disabled={!annTitle.trim() || !annBody.trim()}
                onClick={() => {
                  addAnnouncement(annTitle, annBody);
                  toast.success("Announcement published to the landing page");
                  setAnnTitle("");
                  setAnnBody("");
                }}
              >
                Publish
              </Button>
            </CardContent>
          </Card>

          {db.announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-5">
                <p className="font-semibold">{a.title}</p>
                <p className="text-sm text-muted-foreground">{a.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(a.createdAt)}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </>
  );
}
