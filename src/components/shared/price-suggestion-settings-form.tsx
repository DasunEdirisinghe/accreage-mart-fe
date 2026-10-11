"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updatePriceSuggestionSettings } from "@/app/actions/pricing";
import type { PriceSuggestionSettings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FIELDS: { key: keyof PriceSuggestionSettings; label: string; horizon: string }[] = [
  { key: "mape_threshold_1_7d", label: "1–7 days", horizon: "near" },
  { key: "mape_threshold_8_14d", label: "8–14 days", horizon: "mid" },
  { key: "mape_threshold_15_30d", label: "15–30 days", horizon: "long" },
];

export function PriceSuggestionSettingsForm({ settings }: { settings: PriceSuggestionSettings }) {
  const router = useRouter();
  const [values, setValues] = React.useState(settings);
  const [saving, setSaving] = React.useState(false);

  const change = (key: keyof PriceSuggestionSettings, raw: string) => {
    setValues((prev) => ({ ...prev, [key]: raw === "" ? ("" as unknown as number) : Number(raw) }));
  };

  const invalid = FIELDS.some(({ key }) => {
    const v = values[key];
    return typeof v !== "number" || Number.isNaN(v) || v <= 0 || v > 100;
  });

  const save = async () => {
    setSaving(true);
    const res = await updatePriceSuggestionSettings(values);
    setSaving(false);
    if (res.ok && res.settings) {
      setValues(res.settings);
      toast.success("Price suggestion settings saved");
      router.refresh();
    } else {
      toast.error(res.error ?? "Could not save the settings");
    }
  };

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        <p className="text-sm text-muted-foreground">
          Below this MAPE (%), a horizon shows a price suggestion. Above it, nothing is shown for
          that horizon — the seller just sets their own price.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {FIELDS.map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={key}>{label}</Label>
              <div className="relative">
                <Input
                  id={key}
                  type="number"
                  min={0.01}
                  max={100}
                  step={0.01}
                  value={values[key] as number}
                  onChange={(e) => change(key, e.target.value)}
                  className="pr-7"
                />
                <span className="absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                  %
                </span>
              </div>
            </div>
          ))}
        </div>
        <Button type="button" onClick={save} disabled={saving || invalid}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
