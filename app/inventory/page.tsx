"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Minus,
  Package,
  Plus,
  Save,
  Warehouse,
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
  price: number;
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
  "box-wine": "/scatolavino.png",
  "box-honey": "/scatolamiele.png",
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);

  const [quantities, setQuantities] = useState<
    Record<string, string>
  >({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    try {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .order("category", {
          ascending: false,
        })
        .order("product_name", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      const rows = (data || []) as InventoryItem[];

      setItems(rows);

      const initialQuantities: Record<
        string,
        string
      > = {};

      rows.forEach((item) => {
        initialQuantities[item.product_id] =
          String(Number(item.quantity) || 0);
      });

      setQuantities(initialQuantities);
    } catch (error: any) {
      console.error(error);

      setErrorMessage(
        error?.message ||
          "Errore durante il caricamento del magazzino."
      );
    } finally {
      setLoading(false);
    }
  }

  function numericQuantity(productId: string) {
    const value = Number(quantities[productId]);

    if (Number.isNaN(value) || value < 0) {
      return 0;
    }

    return Math.floor(value);
  }

  function changeQuantity(
    productId: string,
    value: string
  ) {
    setSaved(false);
    setMessage("");

    if (value === "" || /^\d+$/.test(value)) {
      setQuantities((prev) => ({
        ...prev,
        [productId]: value,
      }));
    }
  }

  function increase(productId: string) {
    setSaved(false);
    setMessage("");

    const current = numericQuantity(productId);

    setQuantities((prev) => ({
      ...prev,
      [productId]: String(current + 1),
    }));
  }

  function decrease(productId: string) {
    setSaved(false);
    setMessage("");

    const current = numericQuantity(productId);

    setQuantities((prev) => ({
      ...prev,
      [productId]: String(
        Math.max(current - 1, 0)
      ),
    }));
  }

  function handleQuantityBlur(productId: string) {
    if (quantities[productId] === "") {
      setQuantities((prev) => ({
        ...prev,
        [productId]: "0",
      }));
    }
  }

  async function saveInventory() {
    try {
      setSaving(true);
      setSaved(false);
      setMessage("");
      setErrorMessage("");

      for (const item of items) {
        const quantity = numericQuantity(
          item.product_id
        );

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

      setSaved(true);
      setMessage("Magazzino aggiornato");

      await loadInventory();

      setTimeout(() => {
        setSaved(false);
        setMessage("");
      }, 2500);
    } catch (error: any) {
      console.error(error);

      setErrorMessage(
        error?.message ||
          "Errore durante il salvataggio."
      );
    } finally {
      setSaving(false);
    }
  }

  const wines = useMemo(
    () =>
      items.filter(
        (item) => item.category === "wine"
      ),
    [items]
  );

  const honey = useMemo(
    () =>
      items.filter(
        (item) => item.category === "honey"
      ),
    [items]
  );

  const boxes = useMemo(
    () =>
      items.filter(
        (item) => item.category === "packaging"
      ),
    [items]
  );

  const wineTotal = wines.reduce(
    (sum, item) =>
      sum + numericQuantity(item.product_id),
    0
  );

  const honeyTotal = honey.reduce(
    (sum, item) =>
      sum + numericQuantity(item.product_id),
    0
  );

  const boxesTotal = boxes.reduce(
    (sum, item) =>
      sum + numericQuantity(item.product_id),
    0
  );

  const totalStock =
    wineTotal + honeyTotal + boxesTotal;

  const stockValue = items.reduce(
    (sum, item) =>
      sum +
      numericQuantity(item.product_id) *
        Number(item.price || 0),
    0
  );

  function ProductCard({
    item,
  }: {
    item: InventoryItem;
  }) {
    const quantityValue =
      quantities[item.product_id] ?? "0";

    return (
      <div className="rounded-[26px] bg-white p-4 shadow-[0_8px_30px_rgba(30,26,21,0.04)]">

        <div className="flex items-center gap-4">

          <div
            className={`relative flex h-[70px] w-[70px] shrink-0 items-center justify-center overflow-hidden rounded-[20px] ${
              item.category === "wine"
                ? "bg-[#F2ECE5]"
                : item.category === "honey"
                ? "bg-[#F1F0E6]"
                : "bg-[#EEEAE4]"
            }`}
          >

            <Image
              src={
                productImages[item.product_id] ||
                "/logo-monteromola.png"
              }
              alt={item.product_name}
              fill
              className="object-contain p-2"
            />

          </div>

          <div className="min-w-0 flex-1">

            <p className="text-base font-semibold">
              {item.product_name}
            </p>

            <p className="mt-1 text-xs text-[#918B83]">
              {item.variant ||
                (item.category === "wine"
                  ? "Vino"
                  : item.category === "honey"
                  ? "Miele"
                  : "Confezione")}
            </p>

            <div className="mt-2 flex items-center gap-3 text-xs font-semibold">

              <span
                className={
                  numericQuantity(
                    item.product_id
                  ) > 0
                    ? "text-[#657052]"
                    : "text-[#A14E4E]"
                }
              >
                {numericQuantity(
                  item.product_id
                )}{" "}
                disponibili
              </span>

            </div>

          </div>

        </div>

        {/* QUANTITÀ */}

        <div className="mt-5">

          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#918B83]">
            Quantità
          </p>

          <div className="flex w-full items-center gap-3">

            <button
              type="button"
              onClick={() =>
                decrease(item.product_id)
              }
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F1EEE7] text-[#211F1C] active:scale-95"
              aria-label={`Diminuisci ${item.product_name}`}
            >
              <Minus size={20} />
            </button>

            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={quantityValue}
              onChange={(e) =>
                changeQuantity(
                  item.product_id,
                  e.target.value
                )
              }
              onBlur={() =>
                handleQuantityBlur(
                  item.product_id
                )
              }
              onFocus={(e) =>
                e.currentTarget.select()
              }
              className="h-12 min-w-0 flex-1 rounded-[18px] border border-black/[0.08] bg-[#FCFAF5] px-3 text-center text-xl font-semibold text-[#211F1C] outline-none focus:border-[#6F2636]/40 focus:ring-2 focus:ring-[#6F2636]/10"
            />

            <button
              type="button"
              onClick={() =>
                increase(item.product_id)
              }
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#6F2636] text-white active:scale-95"
              aria-label={`Aumenta ${item.product_name}`}
            >
              <Plus size={20} />
            </button>

          </div>

        </div>

      </div>
    );
  }

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

      <div className="mx-auto max-w-md px-5 pb-[190px] pt-6">

        {/* HEADER */}

        <header>

          <div className="flex items-center justify-between">

            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
              aria-label="Torna alla home"
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

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2ECE5] text-[#6F2636]">
              <Warehouse size={18} />
            </div>

          </div>

          <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6F2636]">
            Tenuta Monteromola
          </p>

          <h1 className="monteromola-serif mt-1 text-[39px] leading-none">
            Magazzino
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#817B73]">
            Controlla e aggiorna le quantità disponibili.
          </p>

        </header>

        {/* RIEPILOGO */}

        <section className="mt-7 rounded-[32px] bg-[#641F30] p-6 text-white shadow-[0_20px_50px_rgba(91,28,42,0.18)]">

          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
            Disponibilità totale
          </p>

          <div className="mt-3 flex items-end justify-between">

            <div>

              <p className="monteromola-serif text-[52px] leading-none">
                {totalStock}
              </p>

              <p className="mt-2 text-sm text-white/55">
                articoli in magazzino
              </p>

            </div>

            <Warehouse
              size={36}
              className="text-white/55"
            />

          </div>

          <div className="mt-8 grid grid-cols-3 gap-2">

            <div className="rounded-[20px] bg-white/10 p-3">

              <p className="text-[11px] text-white/55">
                Vino
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {wineTotal}
              </p>

            </div>

            <div className="rounded-[20px] bg-white/10 p-3">

              <p className="text-[11px] text-white/55">
                Miele
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {honeyTotal}
              </p>

            </div>

            <div className="rounded-[20px] bg-white/10 p-3">

              <p className="text-[11px] text-white/55">
                Scatole
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {boxesTotal}
              </p>

            </div>

          </div>

          <div className="mt-3 rounded-[20px] bg-white/10 p-4">

            <p className="text-xs text-white/55">
              Valore prodotti a prezzo di vendita
            </p>

            <p className="mt-1 text-2xl font-semibold">
              €{stockValue.toFixed(2)}
            </p>

          </div>

        </section>

        {/* VINO */}

        <section className="mt-10">

          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6F2636]">
            Cantina
          </p>

          <h2 className="monteromola-serif mt-1 text-[30px]">
            Vini
          </h2>

          <div className="mt-4 space-y-3">

            {wines.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
              />
            ))}

          </div>

        </section>

        {/* MIELE */}

        <section className="mt-10">

          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#657052]">
            Dalla Tenuta
          </p>

          <h2 className="monteromola-serif mt-1 text-[30px]">
            Miele
          </h2>

          <div className="mt-4 space-y-3">

            {honey.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
              />
            ))}

          </div>

        </section>

        {/* SCATOLE */}

        <section className="mt-10">

          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C7563]">
            Packaging
          </p>

          <h2 className="monteromola-serif mt-1 text-[30px]">
            Scatole
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#817B73]">
            Gestisci la disponibilità delle confezioni.
          </p>

          {boxes.length > 0 ? (
            <div className="mt-4 space-y-3">

              {boxes.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                />
              ))}

            </div>
          ) : (
            <div className="mt-4 rounded-[24px] bg-white p-5 shadow-[0_8px_30px_rgba(30,26,21,0.04)]">

              <Package
                size={24}
                strokeWidth={1.5}
                className="text-[#6F2636]"
              />

              <p className="mt-3 text-sm font-semibold">
                Nessuna scatola configurata
              </p>

              <p className="mt-1 text-xs leading-5 text-[#817B73]">
                Aggiungi Scatola vino e Scatola miele
                nella tabella inventory.
              </p>

            </div>
          )}

        </section>

        {errorMessage && (
          <div className="mt-6 rounded-[20px] bg-red-50 p-4 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        {message && (
          <div className="mt-6 flex items-center justify-center gap-2 rounded-[20px] bg-[#EEF1E7] p-4 text-sm font-semibold text-[#657052]">
            <Check size={17} />
            {message}
          </div>
        )}

        {/* SALVA */}

        <button
          type="button"
          onClick={saveInventory}
          disabled={saving}
          className={`mt-8 mb-5 flex min-h-[58px] w-full items-center justify-center gap-2 rounded-[22px] px-5 py-4 text-base font-semibold text-white shadow-[0_10px_30px_rgba(111,38,54,0.2)] ${
            saved
              ? "bg-[#657052]"
              : "bg-[#6F2636]"
          } disabled:opacity-50`}
        >

          {saved ? (
            <>
              <Check size={19} />
              Magazzino salvato
            </>
          ) : (
            <>
              <Save size={19} />

              {saving
                ? "Salvataggio..."
                : "Salva magazzino"}
            </>
          )}

        </button>

      </div>

      <BottomNav />

    </main>
  );
}