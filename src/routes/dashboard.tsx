import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, PageHeader } from "@/components/AppShell";
import { productsQuery, salesQuery, profit, revenue } from "@/lib/queries";
import { daysUntil, expiryLabel, expiryTone, inr } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Boxes,
  Clock,
  IndianRupee,
  Package,
  ScanLine,
  ShoppingCart,
  TrendingUp,
  Trophy,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Shop Dashboard | ScanSmart" },
      {
        name: "description",
        content:
          "See total products, stock, today's sales, monthly revenue, profit and products expiring soon in one ScanSmart dashboard.",
      },
      { property: "og:title", content: "Shop Dashboard | ScanSmart" },
      { property: "og:description", content: "Stock, sales, profit and expiry alerts at a glance." },
    ],
  }),
  component: () => (
    <AppShell>
      <Dashboard />
    </AppShell>
  ),
});

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="card-soft p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-3 font-display text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Dashboard() {
  const { data: products = [] } = useQuery(productsQuery);
  const { data: sales = [] } = useQuery(salesQuery);

  const now = new Date();
  const isToday = (d: string) => new Date(d).toDateString() === now.toDateString();
  const isThisMonth = (d: string) => {
    const x = new Date(d);
    return x.getMonth() === now.getMonth() && x.getFullYear() === now.getFullYear();
  };

  const todaySales = sales.filter((s) => isToday(s.sold_at));
  const monthSales = sales.filter((s) => isThisMonth(s.sold_at));
  const totalStock = products.reduce((a, p) => a + p.quantity, 0);
  const totalProfit = sales.reduce((a, s) => a + profit(s), 0);

  const expiring = products
    .map((p) => ({ p, days: daysUntil(p.expiry_date) }))
    .filter((x) => x.days !== null && x.days <= 60)
    .sort((a, b) => (a.days ?? 0) - (b.days ?? 0))
    .slice(0, 5);

  const bestSellers = Object.values(
    sales.reduce<Record<string, { name: string; units: number }>>((acc, s) => {
      acc[s.product_name] ??= { name: s.product_name, units: 0 };
      acc[s.product_name]!.units += s.quantity;
      return acc;
    }, {}),
  )
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Everything about your shop in one place." />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat icon={Package} label="Total products" value={String(products.length)} hint="Registered items" />
        <Stat icon={Boxes} label="Total stock" value={String(totalStock)} hint="Units available" />
        <Stat
          icon={ShoppingCart}
          label="Today's sales"
          value={inr(todaySales.reduce((a, s) => a + revenue(s), 0))}
          hint={`${todaySales.reduce((a, s) => a + s.quantity, 0)} units sold`}
        />
        <Stat
          icon={TrendingUp}
          label="Monthly sales"
          value={inr(monthSales.reduce((a, s) => a + revenue(s), 0))}
          hint={`${monthSales.length} transactions`}
        />
        <Stat icon={IndianRupee} label="Total profit" value={inr(totalProfit)} hint="All time" />
        <Stat
          icon={Clock}
          label="Expiring soon"
          value={String(expiring.length)}
          hint="Within 60 days"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/scan">
            <ScanLine /> Scan product
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/sell">
            <ShoppingCart /> Record a sale
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/inventory">View inventory</Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4" /> Expiring soon
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {expiring.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing expiring in the next 60 days.</p>
            )}
            {expiring.map(({ p, days }) => {
              const tone = expiryTone(days);
              return (
                <div key={p.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.brand ?? "—"}</p>
                  </div>
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
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="size-4" /> Best sellers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bestSellers.length === 0 && (
              <p className="text-sm text-muted-foreground">Record a sale to see your top products.</p>
            )}
            {bestSellers.map((b, i) => (
              <div key={b.name} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-3">
                  <span className="grid size-6 place-items-center rounded-md bg-secondary text-xs font-bold">
                    {i + 1}
                  </span>
                  {b.name}
                </span>
                <span className="text-sm text-muted-foreground">{b.units} units</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
