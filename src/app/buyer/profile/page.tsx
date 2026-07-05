"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm } from "@/components/shared/profile-form";

export default function BuyerProfilePage() {
  return (
    <>
      <PageHeader title="Profile" description="Manage your account, business details and notification preferences." />
      <ProfileForm />
    </>
  );
}
