import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminOnboardingRedirect({ searchParams }: Props) {
  const params = await searchParams;
  const plan = params.plan;
  const query = plan && (plan === "basic" || plan === "pro") ? `?plan=${plan}` : "";
  redirect(`/saas/onboarding${query}`);
}
