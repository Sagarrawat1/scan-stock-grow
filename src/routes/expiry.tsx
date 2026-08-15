import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, PageHeader } from "@/components/AppShell";
import { productsQuery } from "@/lib/queries";
import { dateLabel, daysUntil, expiryLabel, expiryTone, inr } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/expiry")({
  head: () => ({
    meta: [
      { title: "Expiry Tracker | ScanSmart" },
      {
        name: "description",
        content:
          "Track product expiry dates with a days-remaining counter so you can sell stock before it expires and cut losses.",
      },
      { property: "og:title", content: "Expiry Tracker | ScanSmart" },
      { property: "og:description", content: "Never miss an expiring product again." },
    ],
  }),
  component: () => (
    <AppShell>
      <ExpiryPage />
    </AppShell>
  ),
});

function ExpiryPage() {
  const { data: products = [] } = useQuery(productsQuery);

  const rows = products
    .map((p) => ({ p, days: daysUntil(p.expiry_date) }))
    .filter((x) => x.days !== null)
    .sort((a, b) => (a.days ?? 0) - (b.days ?? 0));

  const counts = {
    expired: rows.filter((r) => expiryTone(r.days) === "expired").length,
    critical: rows.filter((r) => expiryTone(r.days) === "critical").length,
    soon: rows.filter((r) => expiryTone(r.days) === "soon").length,
    safe: rows.filter((r) => expiryTone(r.days) === "safe").length,
  };

  return (
    <>
      <PageHeader title="Expiry tracker" subtitle="Products expiring soonest appear first." />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Expired" value={counts.expired} className="text-danger" />
        <Tile label="Under 1 month" value={counts.critical} className="text-danger" />
        <Tile label="Expiring soon" value={counts.soon} className="text-warning" />
        <Tile label="Safe" value={counts.safe} className="text-success" />
      </div>

      {rows.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No expiry dates recorded yet. Add expiry dates when registering products.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {rows.map(({ p, days }) => {
          const tone = expiryTone(days);
          const bar =
            tone === "expired" || tone === "critical"
              ? "bg-danger"
              : tone === "soon"
                ? "bg-warning"
                : "bg-success";
          return (
            <div key={p.id} className="card-soft flex items-stretch overflow-hidden">
              <span className={`w-1.5 shrink-0 ${bar}`} />
              <div className="flex flex-1 flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-display font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.brand ?? "No brand"} · {p.quantity} units · MRP {inr(p.mrp)}
                  </p>
                </div>
                <div className="text-right">
                  <Badge
                    variant="outline"
                    className={
                      tone === "expired" || tone === "critical"
                        ? "border-danger text-danger"
                        : tone === "soon"
                          ? "border-warning text-warning"
                          : "border-success text-success"
                    }
                  >
                    {expiryLabel(days)}
                  </Badge>
                  <p className="mt-1 text-xs text-muted-foreground">{dateLabel(p.expiry_date)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Tile({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="card-soft p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-2 font-display text-2xl font-bold ${className}`}>{value}</p>
    </div>
  );
}
