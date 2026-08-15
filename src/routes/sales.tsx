import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell, PageHeader } from "@/components/AppShell";
import { productsQuery, salesQuery, profit, revenue, type Sale } from "@/lib/queries";
import { inr, timeLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: "Sales & Profit Dashboard | ScanSmart" },
      {
        name: "description",
        content:
          "Analyse sales for today, this month, this year or a custom period — revenue, units sold, profit, best sellers and slow movers.",
      },
      { property: "og:title", content: "Sales & Profit Dashboard | ScanSmart" },
      { property: "og:description", content: "Turn your sales data into useful business information." },
    ],
  }),
  component: () => (
    <AppShell>
      <SalesPage />
    </AppShell>
  ),
});

type RangeKey = "today" | "week" | "month" | "year" | "custom";

const ranges: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "Last 7 days" },
  { key: "month", label: "This month" },
  { key: "year", label: "This year" },
  { key: "custom", label: "Custom" },
];

function inRange(sale: Sale, key: RangeKey, from: string, to: string) {
  const d = new Date(sale.sold_at);
  const now = new Date();
  switch (key) {
    case "today":
      return d.toDateString() === now.toDateString();
    case "week":
      return d.getTime() >= now.getTime() - 7 * 86_400_000;
    case "month":
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    case "year":
      return d.getFullYear() === now.getFullYear();
    case "custom": {
      const start = from ? new Date(from + "T00:00:00") : null;
      const end = to ? new Date(to + "T23:59:59") : null;
      return (!start || d >= start) && (!end || d <= end);
    }
  }
}

function SalesPage() {
  const { data: sales = [] } = useQuery(salesQuery);
  const { data: products = [] } = useQuery(productsQuery);
  const [range, setRange] = useState<RangeKey>("today");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(
    () => sales.filter((s) => inRange(s, range, from, to)),
    [sales, range, from, to],
  );

  const totalRevenue = filtered.reduce((a, s) => a + revenue(s), 0);
  const totalProfit = filtered.reduce((a, s) => a + profit(s), 0);
  const units = filtered.reduce((a, s) => a + s.quantity, 0);

  const byProduct = Object.values(
    filtered.reduce<Record<string, { name: string; units: number; revenue: number; profit: number }>>(
      (acc, s) => {
        acc[s.product_name] ??= { name: s.product_name, units: 0, revenue: 0, profit: 0 };
        const row = acc[s.product_name]!;
        row.units += s.quantity;
        row.revenue += revenue(s);
        row.profit += profit(s);
        return acc;
      },
      {},
    ),
  ).sort((a, b) => b.units - a.units);

  const soldNames = new Set(sales.map((s) => s.product_name));
  const slowMovers = products.filter((p) => !soldNames.has(p.name)).slice(0, 6);

  return (
    <>
      <PageHeader title="Sales & profit" subtitle="Understand your business performance." />

      <div className="mb-4 flex flex-wrap gap-2">
        {ranges.map((r) => (
          <Button
            key={r.key}
            size="sm"
            variant={range === r.key ? "default" : "outline"}
            onClick={() => setRange(r.key)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      {range === "custom" && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 sm:max-w-md">
          <div className="space-y-2">
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total revenue" value={inr(totalRevenue)} />
        <Stat label="Total profit" value={inr(totalProfit)} tone={totalProfit < 0 ? "danger" : "success"} />
        <Stat label="Units sold" value={String(units)} />
        <Stat label="Transactions" value={String(filtered.length)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Best-selling products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {byProduct.length === 0 && (
              <p className="text-sm text-muted-foreground">No sales in this period.</p>
            )}
            {byProduct.slice(0, 8).map((row, i) => {
              const max = byProduct[0]?.units || 1;
              return (
                <div key={row.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {i + 1}. {row.name}
                    </span>
                    <span className="text-muted-foreground">
                      {row.units} units · {inr(row.revenue)}
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${(row.units / max) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Slow-moving products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {slowMovers.length === 0 && (
              <p className="text-sm text-muted-foreground">Every product has sold at least once.</p>
            )}
            {slowMovers.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span>{p.name}</span>
                <span className="text-muted-foreground">{p.quantity} in stock</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <h2 className="mt-8 mb-3 text-lg font-semibold">Transactions</h2>
      <div className="grid gap-2">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">No transactions in this period.</p>
        )}
        {filtered.map((s) => (
          <div key={s.id} className="card-soft flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
            <div>
              <p className="font-medium">{s.product_name}</p>
              <p className="text-xs text-muted-foreground">
                {s.quantity} × {inr(s.selling_price)} · {timeLabel(s.sold_at)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display font-bold">{inr(revenue(s))}</p>
              <p className={`text-xs ${profit(s) < 0 ? "text-danger" : "text-success"}`}>
                profit {inr(profit(s))}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "success" | "danger" }) {
  return (
    <div className="card-soft p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={`mt-2 font-display text-2xl font-bold ${
          tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
