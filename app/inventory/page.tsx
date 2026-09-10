"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type InventoryItem = {
  id: number;
  product_id: string;
  product_name: string;
  variant: string | null;
  category: string;
  quantity: number;
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("category")
      .order("product_name");

    if (error) {
      console.error(error);
      setMessage("Errore nel caricamento.");
      setLoading(false);
      return;
    }

    const rows = (data || []) as InventoryItem[];

    setItems(rows);

    const initialValues: Record<string, string> = {};

    rows.forEach((item) => {
      initialValues[item.product_id] = String(item.quantity ?? 0);
    });

    setQuantities(initialValues);
    setLoading(false);
  }

  function changeQuantity(productId: string, value: string) {
    if (value === "" || /^\d+$/.test(value)) {
      setQuantities((prev) => ({
        ...prev,
        [productId]: value,
      }));
    }
  }

  function increase(productId: string) {
    const current = Number(quantities[productId] || 0);

    setQuantities((prev) => ({
      ...prev,
      [productId]: String(current + 1),
    }));
  }

  function decrease(productId: string) {
    const current = Number(quantities[productId] || 0);

    setQuantities((prev) => ({
      ...prev,
      [productId]: String(Math.max(current - 1, 0)),
    }));
  }

  async function saveInventory() {
    setSaving(true);
    setMessage("");

    try {
      for (const item of items) {
        const quantity = Number(quantities[item.product_id] || 0);

        const { error } = await supabase
          .from("inventory")
          .update({
            quantity,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        if (error) {
          throw error;
        }
      }

      setMessage("Magazzino salvato.");
    } catch (error) {
      console.error(error);
      setMessage("Errore durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FCFAF5] p-6">
        <p>Caricamento...</p>
      </main>
    );
  }

  const wines = items.filter((item) => item.category === "wine");
  const honey = items.filter((item) => item.category === "honey");

  function ProductRow({ item }: { item: InventoryItem }) {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div>
          <p className="text-lg font-semibold">
            {item.product_name}
          </p>

          <p className="text-sm text-gray-500">
            {item.variant || (item.category === "wine" ? "Vino" : "Miele")}
          </p>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => decrease(item.product_id)}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-200 text-2xl font-bold"
          >
            −
          </button>

          <input
            type="text"
            inputMode="numeric"
            value={quantities[item.product_id] ?? ""}
            onChange={(e) =>
              changeQuantity(item.product_id, e.target.value)
            }
            onFocus={(e) => e.currentTarget.select()}
            className="h-12 min-w-0 flex-1 rounded-xl border border-gray-300 bg-white text-center text-xl font-bold text-black"
          />

          <button
            type="button"
            onClick={() => increase(item.product_id)}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6F2636] text-2xl font-bold text-white"
          >
            +
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FCFAF5] px-5 pb-40 pt-8 text-[#211F1C]">

      <div className="mx-auto max-w-md">

        <p className="text-sm font-semibold uppercase tracking-widest text-[#6F2636]">
          Tenuta Monteromola
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          Magazzino
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Modifica direttamente le quantità disponibili.
        </p>

        <section className="mt-8">
          <h2 className="mb-4 text-2xl font-bold">
            Vino
          </h2>

          <div className="space-y-4">
            {wines.map((item) => (
              <ProductRow key={item.id} item={item} />
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-bold">
            Miele
          </h2>

          <div className="space-y-4">
            {honey.map((item) => (
              <ProductRow key={item.id} item={item} />
            ))}
          </div>
        </section>

        {message && (
          <p className="mt-6 text-center text-sm font-semibold">
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={saveInventory}
          disabled={saving}
          className="mt-8 mb-10 w-full rounded-2xl bg-[#6F2636] px-5 py-5 text-lg font-bold text-white disabled:opacity-50"
        >
          {saving ? "Salvataggio..." : "Salva magazzino"}
        </button>

      </div>
    </main>
  );
}