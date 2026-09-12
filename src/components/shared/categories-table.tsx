"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Tags, X } from "lucide-react";
import { toast } from "sonner";

import {
  deleteCategory,
  upsertCategory,
  type CommodityOption,
} from "@/app/actions/pricing";
import type { PricingCategory, CategoryArea } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AREAS: CategoryArea[] = ["Fruits", "Vegetables", "Fertilizer", "Tools", "Rice", "Other"];

type FormValues = { title: string; area: CategoryArea; commodity: string | null };
const emptyForm: FormValues = { title: "", area: "Other", commodity: null };

export function CategoriesTable({
  categories,
  commodities,
}: {
  categories: PricingCategory[];
  commodities: CommodityOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const [editing, setEditing] = React.useState<PricingCategory | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormValues>(emptyForm);
  const [commoditySearch, setCommoditySearch] = React.useState("");

  const [deleting, setDeleting] = React.useState<PricingCategory | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setCommoditySearch("");
    setFormOpen(true);
  };

  const openEdit = (category: PricingCategory) => {
    setEditing(category);
    setForm({ title: category.title, area: category.area, commodity: category.commodity });
    setCommoditySearch("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setCommoditySearch("");
  };

  const save = () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    startTransition(async () => {
      const res = await upsertCategory({
        name: editing?.name,
        title: form.title.trim(),
        area: form.area,
        commodity: form.commodity,
      });
      if (res.ok) {
        toast.success(editing ? "Category updated" : "Category created");
        closeForm();
        router.refresh();
      } else {
        toast.error(res.error ?? "Could not save the category");
      }
    });
  };

  const confirmDelete = () => {
    if (!deleting) return;
    startTransition(async () => {
      const res = await deleteCategory(deleting.name);
      if (res.ok) {
        toast.success("Category deleted");
        setDeleting(null);
        router.refresh();
      } else {
        toast.error(res.error ?? "Could not delete the category");
      }
    });
  };

  const filteredCommodities = commoditySearch.trim()
    ? commodities.filter((c) => c.name.toLowerCase().includes(commoditySearch.trim().toLowerCase()))
    : commodities;

  // Reverse-lookup: every OTHER category already linked to the currently-selected commodity.
  const sharedWith = form.commodity
    ? categories.filter((c) => c.commodity === form.commodity && c.name !== editing?.name)
    : [];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>New category</Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No categories yet"
          description="Categories are what sellers pick from when listing — create one and optionally link it to a priced commodity."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Title</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Commodity</TableHead>
                  <TableHead className="pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.name}>
                    <TableCell className="pl-4 font-medium">{category.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{category.area}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.commodity || "—"}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <Button size="sm" variant="outline" onClick={() => openEdit(category)}>
                        Edit
                      </Button>{" "}
                      <Button size="sm" variant="destructive" onClick={() => setDeleting(category)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create / edit form */}
      <Dialog open={formOpen} onOpenChange={(o) => !o && closeForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit category" : "New category"}</DialogTitle>
            <DialogDescription>
              Sellers pick this on the listing form. Link it to a commodity to power AI price
              suggestions, or leave it blank for non-priced areas like Tools or Fertilizer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-title">Title</Label>
              <Input
                id="category-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Carrot — Up Country"
              />
            </div>

            <div className="space-y-2">
              <Label>Area</Label>
              <Select
                value={form.area}
                onValueChange={(value) => setForm((f) => ({ ...f, area: value as CategoryArea }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AREAS.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Commodity (optional)</Label>
              {form.commodity ? (
                <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span>{form.commodity}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setForm((f) => ({ ...f, commodity: null }))}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    placeholder="Search commodities…"
                    value={commoditySearch}
                    onChange={(e) => setCommoditySearch(e.target.value)}
                  />
                  <div className="max-h-40 overflow-y-auto rounded-md border">
                    {filteredCommodities.length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground">No matching commodities</p>
                    ) : (
                      filteredCommodities.slice(0, 50).map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-secondary"
                          onClick={() => {
                            setForm((f) => ({ ...f, commodity: c.name }));
                            setCommoditySearch("");
                          }}
                        >
                          {c.name}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}

              {form.commodity && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  {sharedWith.length === 0 ? (
                    <p className="text-muted-foreground">
                      No other category uses this commodity yet.
                    </p>
                  ) : (
                    <>
                      <p className="mb-1 font-medium">Also used by:</p>
                      <ul className="list-inside list-disc text-muted-foreground">
                        {sharedWith.map((c) => (
                          <li key={c.name}>{c.title}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button onClick={save} disabled={pending}>
              {pending ? "Saving…" : editing ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &quot;{deleting?.title}&quot;?</DialogTitle>
            <DialogDescription>
              This can&apos;t be undone. The linked commodity (if any) and its price data are
              never affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={pending}>
              {pending ? "Deleting…" : "Delete category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
