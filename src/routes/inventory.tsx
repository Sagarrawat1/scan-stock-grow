import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell, PageHeader } from "@/components/AppShell";
import { productsQuery, type Product } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { dateLabel, daysUntil, expiryLabel, expiryTone, inr } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory | ScanSmart" },
      {
        name: "description",
        content:
          "Search your shop inventory by name, brand or barcode. Check stock, purchase price, MRP and expiry dates, and update quantities.",
      },
      { property: "og:title", content: "Inventory | ScanSmart" },
      { property: "og:description", content: "Your entire shop stock, organized digitally." },
    ],
  }),
  component: () => (
    <AppShell>
      <InventoryPage />
    </AppShell>
  ),
});

function InventoryPage() {
  const [q, setQ] = useState("");
  const { data: products = [], isLoading } = useQuery(productsQuery);
  const qc = useQueryClient();

  const adjust = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { error } = await supabase.from("products").update({ quantity }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
    onError: () => toast.error("Could not update quantity"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product removed");
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => toast.error("Could not remove product"),
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) =>
      [p.name, p.brand, p.category, p.barcode].some((v) => v?.toLowerCase().includes(term)),
    );
  }, [products, q]);

  return (
    <>
      <PageHeader title="Inventory" subtitle="Know exactly what is in your shop." />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name, brand, category or barcode"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading inventory…</p>}
      {!isLoading && filtered.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No products found. Scan a barcode to add your first product.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {filtered.map((p) => (
          <Row key={p.id} product={p} onAdjust={adjust.mutate} onRemove={remove.mutate} />
        ))}
      </div>
    </>
  );
}

function Row({
  product: p,
  onAdjust,
  onRemove,
}: {
  product: Product;
  onAdjust: (v: { id: string; quantity: number }) => void;
  onRemove: (id: string) => void;
}) {
  const days = daysUntil(p.expiry_date);
  const tone = expiryTone(days);
  const toneClass =
    tone === "expired" || tone === "critical"
      ? "border-danger text-danger"
      : tone === "soon"
        ? "border-warning text-warning"
        : tone === "safe"
          ? "border-success text-success"
          : "";

  return (
    <div className="card-soft p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display font-semibold">{p.name}</p>
          <p className="text-xs text-muted-foreground">
            {[p.brand, p.category].filter(Boolean).join(" · ") || "No brand"} · #{p.barcode}
          </p>
        </div>
        {days !== null && (
          <Badge variant="outline" className={toneClass}>
            {expiryLabel(days)}
          </Badge>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Meta label="Purchase" value={inr(p.purchase_price)} />
        <Meta label="MRP" value={inr(p.mrp)} />
        <Meta label="Mfg date" value={dateLabel(p.manufacturing_date)} />
        <Meta label="Expiry" value={dateLabel(p.expiry_date)} />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button
          size="icon"
          variant="outline"
          aria-label="Decrease quantity"
          onClick={() => onAdjust({ id: p.id, quantity: Math.max(0, p.quantity - 1) })}
        >
          <Minus />
        </Button>
        <span className="min-w-16 text-center font-display text-lg font-bold">{p.quantity}</span>
        <Button
          size="icon"
          variant="outline"
          aria-label="Increase quantity"
          onClick={() => onAdjust({ id: p.id, quantity: p.quantity + 1 })}
        >
          <Plus />
        </Button>
        <span className="text-xs text-muted-foreground">units in stock</span>
        <Button
          size="icon"
          variant="ghost"
          className="ml-auto text-destructive"
          aria-label="Remove product"
          onClick={() => onRemove(p.id)}
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
