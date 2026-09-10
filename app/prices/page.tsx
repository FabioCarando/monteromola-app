"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Euro,
  Package,
  Save,
  Tags,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";

type PriceItem = {
  id: number;
  product_id: string;
  product_name: string;
  variant: string | null;
  category: string;
  price: number;
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

export default function PricesPage() {
  const [items, setItems] = useState<PriceItem[]>([]);

  const [prices, setPrices] = useState<
    Record<string, string>
  >({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadPrices();
  }, []);

  async function loadPrices() {
    try {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("inventory")
        .select(`
          id,
          product_id,
          product_name,
          variant,
          category,
          price
        `)
        .order("product_name", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      const rows = (data || []) as PriceItem[];

      setItems(rows);

      const initialPrices: Record<string, string> = {};

      rows.forEach((item) => {
        initialPrices[item.product_id] =
          Number(item.price || 0).toFixed(2);
      });

      setPrices(initialPrices);
    } catch (error: any) {
      console.error(error);

      setErrorMessage(
        error?.message ||
          "Errore durante il caricamento dei prezzi."
      );
    } finally {
      setLoading(false);
    }
  }

  function numericPrice(productId: string) {
    const value = Number(
      String(prices[productId] || "0").replace(
        ",",
        "."
      )
    );

    if (Number.isNaN(value) || value < 0) {
      return 0;
    }

    return value;
  }

  function changePrice(
    productId: string,
    value: string
  ) {
    setSaved(false);
    setMessage("");

    const normalized = value.replace(",", ".");

    if (
      normalized === "" ||
      /^\d*\.?\d{0,2}$/.test(normalized)
    ) {
      setPrices((prev) => ({
        ...prev,
        [productId]: value,
      }));
    }
  }

  function handleBlur(productId: string) {
    const value = numericPrice(productId);

    setPrices((prev) => ({
      ...prev,
      [productId]: value.toFixed(2),
    }));
  }

  async function savePrices() {
    try {
      setSaving(true);
      setSaved(false);
      setMessage("");
      setErrorMessage("");

      for (const item of items) {
        const price = numericPrice(
          item.product_id
        );

        const { error } = await supabase
          .from("inventory")
          .update({
            price,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        if (error) {
          throw error;
        }
      }

      setSaved(true);
      setMessage("Prezzi aggiornati");

      await loadPrices();

      setTimeout(() => {
        setSaved(false);
        setMessage("");
      }, 2500);
    } catch (error: any) {
      console.error(error);

      setErrorMessage(
        error?.message ||
          "Errore durante il salvataggio dei prezzi."
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

  function PriceCard({
    item,
  }: {
    item: PriceItem;
  }) {
    const isBox =
      item.category === "packaging";

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
            {isBox ? (
              <Package
                size={30}
                strokeWidth={1.5}
                className="text-[#6F2636]"
              />
            ) : (
              <Image
                src={
                  productImages[item.product_id] ||
                  "/logo-monteromola.png"
                }
                alt={item.product_name}
                fill
                className="object-contain p-1"
              />
            )}
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

            <p className="mt-2 text-sm font-semibold text-[#6F2636]">
              €{numericPrice(
                item.product_id
              ).toFixed(2)}
            </p>

          </div>

        </div>

        <div className="mt-4">

          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#918B83]">
            Prezzo unitario
          </p>

          <div className="relative">

            <Euro
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6F2636]"
            />

            <input
              type="text"
              inputMode="decimal"
              value={
                prices[item.product_id] ?? ""
              }
              onChange={(e) =>
                changePrice(
                  item.product_id,
                  e.target.value
                )
              }
              onBlur={() =>
                handleBlur(item.product_id)
              }
              onFocus={(e) =>
                e.currentTarget.select()
              }
              className="h-13 w-full rounded-[18px] border border-black/[0.08] bg-[#FCFAF5] py-3 pl-11 pr-4 text-lg font-semibold text-[#211F1C] outline-none focus:border-[#6F2636]/40 focus:ring-2 focus:ring-[#6F2636]/10"
            />

          </div>

        </div>

      </div>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FCFAF5]">
        <p className="text-sm text-[#817B73]">
          Caricamento prezzi...
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
              <Tags size={18} />
            </div>

          </div>

          <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6F2636]">
            Tenuta Monteromola
          </p>

          <h1 className="monteromola-serif mt-1 text-[39px] leading-none">
            Prezzi
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#817B73]">
            Imposta i prezzi utilizzati per le nuove vendite.
          </p>

        </header>

        {/* INFO */}

        <section className="mt-7 rounded-[28px] bg-[#641F30] p-5 text-white">

          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
            Listino corrente
          </p>

          <p className="monteromola-serif mt-2 text-[28px] leading-tight">
            Modifica una volta.
            <br />
            Usa ovunque.
          </p>

          <p className="mt-3 text-xs leading-5 text-white/55">
            I nuovi prezzi saranno utilizzati
            automaticamente nelle nuove vendite.
          </p>

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
              <PriceCard
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
              <PriceCard
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

          <p className="mt-2 text-sm text-[#817B73]">
            Prezzi delle confezioni utilizzati nel calcolo delle vendite.
          </p>

          <div className="mt-4 space-y-3">
            {boxes.map((item) => (
              <PriceCard
                key={item.id}
                item={item}
              />
            ))}
          </div>

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

        <button
          type="button"
          onClick={savePrices}
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
              Prezzi salvati
            </>
          ) : (
            <>
              <Save size={19} />
              {saving
                ? "Salvataggio..."
                : "Salva listino"}
            </>
          )}

        </button>

      </div>

      <BottomNav />

    </main>
  );
}