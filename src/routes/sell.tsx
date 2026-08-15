import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell, PageHeader } from "@/components/AppShell";
import BarcodeScanner from "@/components/BarcodeScanner";
import { productsQuery, salesQuery, type Product, revenue } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { inr, timeLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Record a Sale | ScanSmart" },
      {
        name: "description",
        content:
          "Scan a barcode to record a sale. ScanSmart updates stock automatically and calculates profit on every transaction.",
      },
      { property: "og:title", content: "Record a Sale | ScanSmart" },
      { property: "og:description", content: "Scan. Sell. Record. Stock updates itself." },
    ],
  }),
  component: () => (
    <AppShell>
      <SellPage />
    </AppShell>
  ),
});

function SellPage() {
  const { data: products = [] } = useQuery(productsQuery);
  const { data: sales = [] } = useQuery(salesQuery);
  const qc = useQueryClient();

  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);

  const matches = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return [];
    return products
      .filter((p) => [p.name, p.brand, p.barcode].some((v) => v?.toLowerCase().includes(t)))
      .slice(0, 6);
  }, [products, term]);

  function choose(p: Product) {
    setSelected(p);
    setPrice(String(p.mrp));
    setTerm("");
  }

  function onDetected(code: string) {
    const found = products.find((p) => p.barcode === code);
    if (!found) {
      toast.error(`No product found for barcode ${code}`);
      return;
    }
    choose(found);
    toast.success(`${found.name} selected`);
  }

  async function record(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const quantity = Number(qty) || 0;
    if (quantity <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    if (quantity > selected.quantity) {
      toast.error("Not enough stock available");
      return;
    }


    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Please sign in again.");

      const { error: saleError } = await supabase.from("sales").insert({
        user_id: uid,
        product_id: selected.id,
        product_name: selected.name,
        barcode: selected.barcode,
        quantity,
        selling_price: Number(price) || 0,
        purchase_price: selected.purchase_price,
      });
      if (saleError) throw saleError;

      const { error: stockError } = await supabase
        .from("products")
        .update({ quantity: selected.quantity - quantity })
        .eq("id", selected.id);
      if (stockError) throw stockError;

      toast.success(
        `Sale recorded · profit ${inr((Number(price) - selected.purchase_price) * quantity)}`,
      );
      setSelected(null);
      setQty("1");
      setPrice("");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["products"] }),
        qc.invalidateQueries({ queryKey: ["sales"] }),
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not record sale");
    } finally {
      setBusy(false);
    }
  }

  const lineProfit = selected ? (Number(price) - selected.purchase_price) * (Number(qty) || 0) : 0;

  return (
    <>
      <PageHeader title="Record a sale" subtitle="Scan. Sell. Record. Stock updates automatically." />
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Find the product</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <BarcodeScanner onDetected={onDetected} />
            <div className="space-y-2">
              <Label htmlFor="search">Or search manually</Label>
              <Input
                id="search"
                placeholder="Product name or barcode"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
              />
              {matches.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => choose(p)}
                  className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <span>{p.name}</span>
                  <span className="text-xs text-muted-foreground">{p.quantity} in stock</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sale details</CardTitle>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <p className="text-sm text-muted-foreground">
                Scan or select a product to record a sale.
              </p>
            ) : (
              <form onSubmit={record} className="space-y-4">
                <div className="rounded-lg bg-secondary p-3">
                  <p className="font-display font-semibold">{selected.name}</p>
                  <p className="text-xs text-muted-foreground">
                    #{selected.barcode} · {selected.quantity} in stock · bought at{" "}
                    {inr(selected.purchase_price)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="qty">Quantity sold</Label>
                    <Input id="qty" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Selling price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                  <span className="text-muted-foreground">Profit on this sale</span>
                  <span className={`font-display text-lg font-bold ${lineProfit < 0 ? "text-danger" : "text-success"}`}>
                    {inr(lineProfit)}
                  </span>
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  Record sale
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <h2 className="mt-8 mb-3 text-lg font-semibold">Recent sales</h2>
      <div className="grid gap-2">
        {sales.slice(0, 8).map((s) => (
          <div key={s.id} className="card-soft flex items-center justify-between p-3 text-sm">
            <div>
              <p className="font-medium">{s.product_name}</p>
              <p className="text-xs text-muted-foreground">
                {s.quantity} × {inr(s.selling_price)} · {timeLabel(s.sold_at)}
              </p>
            </div>
            <span className="font-display font-bold">{inr(revenue(s))}</span>
          </div>
        ))}
        {sales.length === 0 && <p className="text-sm text-muted-foreground">No sales recorded yet.</p>}
      </div>
    </>
  );
}
