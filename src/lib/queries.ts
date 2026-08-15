import { supabase } from "@/integrations/supabase/client";

export type Product = {
  id: string;
  barcode: string;
  name: string;
  brand: string | null;
  category: string | null;
  quantity: number;
  purchase_price: number;
  mrp: number;
  manufacturing_date: string | null;
  expiry_date: string | null;
  purchase_date: string | null;
  created_at: string;
};

export type Sale = {
  id: string;
  product_id: string | null;
  product_name: string;
  barcode: string | null;
  quantity: number;
  selling_price: number;
  purchase_price: number;
  sold_at: string;
};

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Product[];
}

export async function fetchSales(): Promise<Sale[]> {
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .order("sold_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? []) as unknown as Sale[];
}

export const productsQuery = { queryKey: ["products"], queryFn: fetchProducts };
export const salesQuery = { queryKey: ["sales"], queryFn: fetchSales };

export const revenue = (s: Sale) => s.selling_price * s.quantity;
export const profit = (s: Sale) => (s.selling_price - s.purchase_price) * s.quantity;
