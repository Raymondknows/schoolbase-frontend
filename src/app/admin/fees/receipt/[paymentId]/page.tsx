export default async function Page({ params }: { params?: Record<string, string> }) {
  const basePath = typeof window !== "undefined" && window.location.pathname.startsWith("/accounting") ? "/accounting/fees" : "/admin/fees";

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Receipt details</h1>
      <p className="mt-2 text-sm text-muted">This receipt page is available in the current fee workflow.</p>
      <a href={basePath} className="mt-4 inline-flex items-center text-sm font-medium text-brand hover:underline">
        Back to fees
      </a>
    </div>
  );
}
