"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm } from "@/components/shared/profile-form";

export default function SellerProfilePage() {
  return (
    <>
      <PageHeader title="Profile" description="Manage your business profile, verification and notification preferences." />
      <ProfileForm />
    </>
  );
}
