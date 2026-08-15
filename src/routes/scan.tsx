import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell, PageHeader } from "@/components/AppShell";
import BarcodeScanner from "@/components/BarcodeScanner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Add Product by Barcode | ScanSmart" },
      {
        name: "description",
        content:
          "Scan a barcode to register a product with brand, quantity, purchase price, MRP, manufacturing and expiry dates.",
      },
      { property: "og:title", content: "Add Product by Barcode | ScanSmart" },
      { property: "og:description", content: "Scan once, save everything — fast product registration." },
    ],
  }),
  component: () => (
    <AppShell>
      <ScanPage />
    </AppShell>
  ),
});

const empty = {
  barcode: "",
  name: "",
  brand: "",
  category: "",
  quantity: "1",
  purchase_price: "",
  mrp: "",
  manufacturing_date: "",
  expiry_date: "",
  purchase_date: new Date().toISOString().slice(0, 10),
};

function ScanPage() {
  const [form, setForm] = useState({ ...empty });
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onDetected(code: string) {
    setForm((f) => ({ ...f, barcode: code }));
    toast.success(`Barcode captured: ${code}`);
    const { data } = await supabase.from("products").select("*").eq("barcode", code).maybeSingle();
    if (data) {
      toast.info("This barcode is already in your inventory — details loaded.");
      setForm((f) => ({
        ...f,
        name: data.name,
        brand: data.brand ?? "",
        category: data.category ?? "",
        purchase_price: String(data.purchase_price),
        mrp: String(data.mrp),
        manufacturing_date: data.manufacturing_date ?? "",
        expiry_date: data.expiry_date ?? "",
      }));
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Please sign in again.");

      const payload = {
        user_id: uid,
        barcode: form.barcode.trim(),
        name: form.name.trim(),
        brand: form.brand.trim() || null,
        category: form.category.trim() || null,
        quantity: Number(form.quantity) || 0,
        purchase_price: Number(form.purchase_price) || 0,
        mrp: Number(form.mrp) || 0,
        manufacturing_date: form.manufacturing_date || null,
        expiry_date: form.expiry_date || null,
        purchase_date: form.purchase_date || null,
      };

      const { data: existing } = await supabase
        .from("products")
        .select("id, quantity")
        .eq("barcode", payload.barcode)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("products")
          .update({ ...payload, quantity: existing.quantity + payload.quantity })
          .eq("id", existing.id);
        if (error) throw error;
        toast.success("Stock updated for existing product.");
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
        toast.success("Product registered in your inventory.");
      }

      await qc.invalidateQueries({ queryKey: ["products"] });
      setForm({ ...empty });
      navigate({ to: "/inventory" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save product");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Add product" subtitle="Scan the barcode, fill the details, save it forever." />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scan barcode</CardTitle>
          </CardHeader>
          <CardContent>
            <BarcodeScanner onDetected={onDetected} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
              <Field label="Barcode" required value={form.barcode} onChange={set("barcode")} />
              <Field label="Product name" required value={form.name} onChange={set("name")} />
              <Field label="Company / Brand" value={form.brand} onChange={set("brand")} />
              <Field label="Category" value={form.category} onChange={set("category")} />
              <Field label="Quantity" type="number" min="0" required value={form.quantity} onChange={set("quantity")} />
              <Field
                label="Purchase price (₹)"
                type="number"
                step="0.01"
                min="0"
                value={form.purchase_price}
                onChange={set("purchase_price")}
              />
              <Field label="MRP (₹)" type="number" step="0.01" min="0" value={form.mrp} onChange={set("mrp")} />
              <Field label="Purchase date" type="date" value={form.purchase_date} onChange={set("purchase_date")} />
              <Field
                label="Manufacturing date"
                type="date"
                value={form.manufacturing_date}
                onChange={set("manufacturing_date")}
              />
              <Field label="Expiry date" type="date" value={form.expiry_date} onChange={set("expiry_date")} />
              <div className="sm:col-span-2">
                <Button type="submit" className="w-full" disabled={busy}>
                  Save to inventory
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...props} />
    </div>
  );
}
