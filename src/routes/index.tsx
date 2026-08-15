import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-shopkeeper.jpg";
import {
  BarChart3,
  Boxes,
  Clock,
  IndianRupee,
  ScanLine,
  Search,
  ShoppingCart,
  Trophy,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ScanSmart — Barcode Inventory & Sales for Shopkeepers" },
      {
        name: "description",
        content:
          "Scan a barcode to register products, track stock and expiry dates, record sales and see profit — smart inventory management for every shopkeeper.",
      },
      { property: "og:title", content: "ScanSmart — Scan. Manage. Sell. Grow." },
      {
        property: "og:description",
        content:
          "Barcode-based inventory, expiry tracking, sales recording and profit analytics in one simple dashboard.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: ScanLine,
    title: "Smart product registration",
    body: "Scan a barcode and save brand, dates, quantity, purchase price and MRP in seconds.",
  },
  {
    icon: Boxes,
    title: "Inventory management",
    body: "See every product, search by name or barcode, and update stock without a notebook.",
  },
  {
    icon: Clock,
    title: "Expiry tracker",
    body: "Products expiring soonest come first, with a clear days-remaining counter.",
  },
  {
    icon: ShoppingCart,
    title: "Smart sales recording",
    body: "Scan at checkout — the sale is logged and stock reduces automatically.",
  },
  {
    icon: IndianRupee,
    title: "Profit & loss",
    body: "Selling price minus purchase price, calculated daily, monthly and yearly.",
  },
  {
    icon: Trophy,
    title: "Best sellers & insights",
    body: "Find top products, slow movers and sales trends for any time period.",
  },
];

function Landing() {
  const { user } = useAuth();
  const primaryTo = user ? "/dashboard" : "/auth";

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <span className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ScanLine className="size-4" />
          </span>
          ScanSmart
        </span>
        <Button asChild size="sm">
          <Link to={primaryTo}>{user ? "Open dashboard" : "Sign in"}</Link>
        </Button>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-2 lg:py-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Search className="size-3" /> Scan. Manage. Sell. Grow.
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight md:text-6xl">
            Smart inventory made simple for every{" "}
            <span className="text-primary">shopkeeper</span>.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            Scan a product barcode and ScanSmart registers it, tracks the stock, warns you before it
            expires, records the sale and calculates your profit.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to={primaryTo}>Get started</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to={user ? "/scan" : "/auth"}>Scan a product</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Grocery · Supermarket · Medical · General store · Cosmetics · Stationery
          </p>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 -z-10 rounded-3xl gradient-hero opacity-20 blur-2xl" />
          <img
            src={heroImage}
            alt="Shopkeeper scanning a product barcode with a phone at the shop counter"
            width={1280}
            height={960}
            className="w-full rounded-2xl border border-border object-cover shadow-[var(--shadow-lift)]"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-3xl font-bold">Everything your shop needs</h2>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Replace notebooks and spreadsheets with one dashboard that keeps stock, expiry and sales in
          sync.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card-soft p-6">
              <span className="grid size-10 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="gradient-hero rounded-3xl px-8 py-14 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground md:text-4xl">
            Manage your shop <span className="text-gradient-accent">smarter</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-primary-foreground/80">
            Scan your products. Track your inventory. Monitor expiry. Record sales. Know your profit.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to={primaryTo}>Get started</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to={user ? "/inventory" : "/auth"}>View inventory</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <span className="font-display font-semibold text-foreground">ScanSmart</span>
          <span>Your Shop. Your Inventory. Your Data.</span>
        </div>
      </footer>
    </div>
  );
}
