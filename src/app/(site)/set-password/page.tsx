import { checkResetKey } from "@/app/actions/auth";
import { SetPasswordClient } from "@/components/shared/set-password-client";

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const key = (await searchParams).key ?? "";
  const valid = await checkResetKey(key);

  return <SetPasswordClient valid={valid} requestKey={key} />;
}
