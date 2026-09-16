import { PurchaseForm } from "@/components/purchase-form";

interface PurchasePageProps {
  searchParams?: Promise<{ plan?: string }>;
}

export default async function PurchasePage({ searchParams }: PurchasePageProps) {
  const params = await searchParams;
  const initialPlan = params?.plan?.toLowerCase() ?? "starter";

  return (
        <main className="min-h-screen w-full bg-[#f6faff] px-0 py-8 sm:px-6 sm:py-16">
      <div className="h-full rounded-none bg-surface p-6 shadow-none sm:mx-auto sm:max-w-6xl sm:rounded-3xl sm:p-10 sm:shadow-sm">
        <PurchaseForm initialPlan={initialPlan} />
      </div>
    </main>
  );
}
