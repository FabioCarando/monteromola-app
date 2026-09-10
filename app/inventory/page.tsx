"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Minus,
  Plus,
  Save,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";

type InventoryItem = {
  id: number;
  product_id: string;
  product_name: string;
  variant: string | null;
  category: string;
  quantity: number;
  updated_at: string | null;
};

const productImages: Record<string, string> = {
  onelia: "/onelia.png",
  gea: "/gea.png",
  giulio: "/giulio.png",

  "acacia-250": "/acacia.png",
  "acacia-500": "/acacia.png",

  "millefiori-250": "/millefiori.png",
  "millefiori-500": "/millefiori.png",

  "melata-250": "/melata.png",
  "melata-500": "/melata.png",
};

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>(
    []
  );

  const [quantities, setQuantities] = useState<
    Record<string, number>
  >({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("category", { ascending: false })
      .order("product_name", { ascending: true });

    if (error) {
      console.error(error);
      setErrorMessage(
        "Errore durante il caricamento del magazzino."
      );
      setLoading(false);
      return;
    }

    const items = (data || []) as InventoryItem[];

    setInventory(items);

    const initialQuantities: Record<string, number> = {};

    items.forEach((item) => {
      initialQuantities[item.product_id] =
        Number(item.quantity) || 0;
    });

    setQuantities(initialQuantities);
    setLoading(false);
  };

  const increase = (productId: string) => {
    setSaved(false);

    setQuantities((current) => ({
      ...current,
      [productId]: (current[productId] || 0) + 1,
    }));
  };

  const decrease = (productId: string) => {
    setSaved(false);

    setQuantities((current) => ({
      ...current,
      [productId]: Math.max(
        (current[productId] || 0) - 1,
        0
      ),
    }));
  };

  const setQuantity = (
    productId: string,
    value: string
  ) => {
    setSaved(false);

    const parsed = Number(value);

    setQuantities((current) => ({
      ...current,
      [productId]:
        Number.isNaN(parsed) || parsed < 0
          ? 0
          : Math.floor(parsed),
    }));
  };

  const saveInventory = async () => {
    try {
      setSaving(true);
      setSaved(false);
      setErrorMessage("");

      const updates = inventory.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        variant: item.variant,
        category: item.category,
        quantity: quantities[item.product_id] || 0,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("inventory")
        .upsert(updates);

      if (error) throw error;

      setSaved(true);

      await loadInventory();

      setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (error: any) {
      console.error(error);

      setErrorMessage(
        error?.message ||
          "Errore durante il salvataggio del magazzino."
      );
    } finally {
      setSaving(false);
    }
  };

  const wines = inventory.filter(
    (item) => item.category === "wine"
  );

  const honey = inventory.filter(
    (item) => item.category === "honey"
  );

  const totalStock = Object.values(quantities).reduce(
    (sum, quantity) => sum + quantity,
    0
  );

  const wineStock = wines.reduce(
    (sum, item) =>
      sum + (quantities[item.product_id] || 0),
    0
  );

  const honeyStock = honey.reduce(
    (sum, item) =>
      sum + (quantities[item.product_id] || 0),
    0
  );

  const renderItem = (item: InventoryItem) => {
    const quantity =
      quantities[item.product_id] || 0;

    return (
      <div
        key={item.id}
        className="flex items-center gap-4 border-b border-black/[0.045] py-4 last:border-0"
      >
        <div
          className={`relative h-[66px] w-[66px] shrink-0 overflow-hidden rounded-[20px] ${
            item.category === "wine"
              ? "bg-[#EEE5DA]"
              : "bg-[#F0EDDF]"
          }`}
        >
          <Image
            src={
              productImages[item.product_id] ||
              "/logo-monteromola.png"
            }
            alt={item.product_name}
            fill
            className="object-contain p-1"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {item.product_name}
          </p>

          <p className="mt-1 text-xs text-[#918B83]">
            {item.variant ||
              (item.category === "wine"
                ? "Vino"
                : "Miele")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => decrease(item.product_id)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1EEE7] text-[#514C46]"
          >
            <Minus size={16} />
          </button>

          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={quantity}
            onChange={(e) =>
              setQuantity(
                item.product_id,
                e.target.value
              )
            }
            className="h-10 w-14 rounded-[14px] border border-black/[0.06] bg-[#FCFAF5] text-center text-sm font-semibold outline-none"
          />

          <button
            type="button"
            onClick={() => increase(item.product_id)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6F2636] text-white"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FCFAF5]">
        <p className="text-sm text-[#817B73]">
          Caricamento magazzino...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FCFAF5] text-[#211F1C]">
      <div className="mx-auto max-w-md px-5 pb-44 pt-6">

        {/* HEADER */}
        <header>
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
            >
              <ArrowLeft size={19} />
            </Link>

            <div className="relative h-11 w-11">
              <Image
                src="/logo-monteromola.png"
                alt="Tenuta Monteromola"
                fill
                className="object-contain"
              />
            </div>

            <div className="h-10 w-10" />
          </div>

          <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6F2636]">
            Tenuta Monteromola
          </p>

          <h1 className="monteromola-serif mt-1 text-[39px] leading-none">
            Magazzino
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#817B73]">
            Aggiorna direttamente le quantità
            disponibili.
          </p>
        </header>

        {/* SUMMARY */}
        <section className="mt-7 overflow-hidden rounded-[32px] bg-[#641F30] p-6 text-white shadow-[0_20px_50px_rgba(91,28,42,0.18)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
            Disponibilità totale
          </p>

          <p className="monteromola-serif mt-3 text-[52px] leading-none">
            {totalStock}
          </p>

          <p className="mt-2 text-sm text-white/55">
            prodotti in magazzino
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-[20px] bg-white/10 p-4">
              <p className="text-xs text-white/55">
                Vino
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {wineStock}
              </p>
            </div>

            <div className="rounded-[20px] bg-white/10 p-4">
              <p className="text-xs text-white/55">
                Miele
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {honeyStock}
              </p>
            </div>
          </div>
        </section>

        {/* WINE */}
        <section className="mt-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6F2636]">
            Cantina
          </p>

          <h2 className="monteromola-serif mt-1 text-[29px]">
            Vino
          </h2>

          <div className="mt-4 rounded-[28px] bg-white px-4 shadow-[0_8px_30px_rgba(30,26,21,0.035)]">
            {wines.map(renderItem)}
          </div>
        </section>

        {/* HONEY */}
        <section className="mt-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#657052]">
            Dalla Tenuta
          </p>

          <h2 className="monteromola-serif mt-1 text-[29px]">
            Miele
          </h2>

          <div className="mt-4 rounded-[28px] bg-white px-4 shadow-[0_8px_30px_rgba(30,26,21,0.035)]">
            {honey.map(renderItem)}
          </div>
        </section>

        {errorMessage && (
          <div className="mt-6 rounded-[18px] bg-red-50 p-4 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

      </div>

      {/* SAVE BAR */}
      <div className="fixed bottom-[72px] left-0 right-0 z-40 px-5">
        <div className="mx-auto max-w-md">
          <button
            type="button"
            onClick={saveInventory}
            disabled={saving}
            className={`flex w-full items-center justify-center gap-2 rounded-[22px] px-5 py-[17px] font-semibold text-white shadow-[0_10px_30px_rgba(111,38,54,0.22)] ${
              saved
                ? "bg-[#657052]"
                : "bg-[#6F2636]"
            } disabled:opacity-50`}
          >
            {saved ? (
              <>
                <Check size={18} />
                Magazzino salvato
              </>
            ) : (
              <>
                <Save size={18} />
                {saving
                  ? "Salvataggio..."
                  : "Salva magazzino"}
              </>
            )}
          </button>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}