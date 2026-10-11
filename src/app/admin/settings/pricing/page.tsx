import { AlertTriangle } from "lucide-react";

import { getPriceSuggestionSettings } from "@/app/actions/pricing";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { PriceSuggestionSettingsForm } from "@/components/shared/price-suggestion-settings-form";

export default async function AdminPriceSuggestionSettingsPage() {
  const settings = await getPriceSuggestionSettings();

  return (
    <>
      <PageHeader
        title="Price suggestion settings"
        description="Tune how accurate a commodity's forecast must be, per horizon, before a price suggestion is shown on the listing form."
      />
      {settings ? (
        <PriceSuggestionSettingsForm settings={settings} />
      ) : (
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load the current settings"
          description="Try reloading the page."
        />
      )}
    </>
  );
}
