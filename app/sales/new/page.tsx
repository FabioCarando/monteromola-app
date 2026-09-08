"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  variant?: string;
  category: "wine" | "honey";
  price: number;
  image: string;
};

const products: Product[] = [
  {
    id: "onelia",
    name: "Onelia",
    category: "wine",
    price: 15,
    image: "/onelia.png",
  },
  {
    id: "gea",
    name: "Gea",
    category: "wine",
    price: 12,
    image: "/gea.png",
  },
  {
    id: "giulio",
    name: "Giulio",
    category: "wine",
    price: 18,
    image: "/giulio.png",
  },
  {
    id: "acacia-250",
    name: "Acacia",
    variant: "250g",
    category: "honey",
    price: 6,
    image: "/acacia.png",
  },
  {
    id: "acacia-500",
    name: "Acacia",
    variant: "500g",
    category: "honey",
    price: 11,
    image: "/acacia.png",
  },
  {
    id: "millefiori-250",
    name: "Millefiori",
    variant: "250g",
    category: "honey",
    price: 6,
    image: "/millefiori.png",
  },
  {
    id: "millefiori-500",
    name: "Millefiori",
    variant: "500g",
    category: "honey",
    price: 11,
    image: "/millefiori.png",
  },
  {
    id: "melata-250",
    name: "Melata",
    variant: "250g",
    category: "honey",
    price: 7,
    image: "/melata.png",
  },
  {
    id: "melata-500",
    name: "Melata",
    variant: "500g",
    category: "honey",
    price: 11,
    image: "/melata.png",
  },
];

const paymentMethods = [
  "Contanti",
  "POS",
  "Bonifico",
  "Altro",
];

export default function NewSalePage() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const [customer, setCustomer] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Contanti");

  const [boxQuantity, setBoxQuantity] = useState(0);
  const [boxCost, setBoxCost] = useState(0);

  const [paymentStatus, setPaymentStatus] = useState("Pagato");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const increase = (id: string) => {
    setQuantities((current) => ({
      ...current,
      [id]: (current[id] || 0) + 1,
    }));
  };

  const decrease = (id: string) => {
    setQuantities((current) => ({
      ...current,
      [id]: Math.max((current[id] || 0) - 1, 0),
    }));
  };

  const selectedProducts = products.filter(
    (product) => (quantities[product.id] || 0) > 0
  );

  const totalProducts = products.reduce(
    (sum, product) =>
      sum + (quantities[product.id] || 0) * product.price,
    0
  );

  const packagingTotal = boxQuantity * boxCost;
  const grandTotal = totalProducts + packagingTotal;

  const totalQuantity = selectedProducts.reduce(
    (sum, product) =>
      sum + (quantities[product.id] || 0),
    0
  );

  const saveSale = async () => {
    if (selectedProducts.length === 0) return;

    try {
      setSaving(true);
      setSaved(false);
      setErrorMessage("");

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer: customer.trim() || null,
          total: grandTotal,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          box_quantity: boxQuantity,
          box_cost: boxCost,
          notes: notes.trim() || null,
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      const items = selectedProducts.map((product) => ({
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        variant: product.variant || null,
        category: product.category,
        quantity: quantities[product.id] || 0,
        unit_price: product.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(items);

      if (itemsError) {
        throw itemsError;
      }

      setSaved(true);
    } catch (error: any) {
      console.error("SUPABASE ERROR:", error);

      setErrorMessage(
        error?.message ||
          error?.details ||
          error?.hint ||
          "Errore durante il salvataggio."
      );
    } finally {
      setSaving(false);
    }
  };

  const renderProduct = (product: Product) => {
    const quantity = quantities[product.id] || 0;
    const selected = quantity > 0;

    return (
      <div
        key={product.id}
        className={`rounded-[26px] border p-4 transition ${
          selected
            ? "border-[#722F37]/30 bg-white shadow-md"
            : "border-transparent bg-white shadow-sm"
        }`}
      >
        <div className="flex items-center gap-4">

          {/* IMAGE */}
          <div
            className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-[18px] ${
              product.category === "wine"
                ? "bg-[#EFE9DE]"
                : "bg-[#F0EBDD]"
            }`}
          >
            <Image
              src={product.image}
              alt={`${product.name} ${product.variant || ""}`}
              fill
              className="object-contain p-1.5"
            />
          </div>

          {/* INFO */}
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {product.name}
            </p>

            <div className="mt-1 flex items-center gap-2">
              {product.variant && (
                <span className="text-xs text-neutral-400">
                  {product.variant}
                </span>
              )}

              <span
                className={
                  product.category === "wine"
                    ? "text-sm font-semibold text-[#722F37]"
                    : "text-sm font-semibold text-[#606C38]"
                }
              >
                €{product.price.toFixed(2)}
              </span>
            </div>
          </div>

          {/* QUANTITY */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => decrease(product.id)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F3EA] text-xl font-medium active:scale-95"
            >
              −
            </button>

            <span className="w-6 text-center text-lg font-semibold">
              {quantity}
            </span>

            <button
              type="button"
              onClick={() => increase(product.id)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#722F37] text-xl font-medium text-white shadow-sm active:scale-95"
            >
              +
            </button>
          </div>

        </div>
      </div>
    );
  };

  if (saved) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3EA] px-5 text-[#27231F]">
        <div className="w-full max-w-md text-center">

          <div className="relative mx-auto h-20 w-20">
            <Image
              src="/logo-monteromola.png"
              alt="Tenuta Monteromola"
              fill
              className="object-contain"
            />
          </div>

          <div className="mx-auto mt-8 flex h-20 w-20 items-center justify-center rounded-full bg-[#606C38]/10 text-4xl text-[#606C38]">
            ✓
          </div>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight">
            Vendita registrata
          </h1>

          <p className="mt-2 text-sm text-neutral-500">
            La vendita è stata salvata correttamente.
          </p>

          <p className="mt-6 text-5xl font-semibold tracking-tight text-[#722F37]">
            €{grandTotal.toFixed(2)}
          </p>

          <div className="mt-7 rounded-[28px] bg-white p-5 text-left shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Riepilogo
            </p>

            <div className="mt-4 space-y-3">
              {selectedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between text-sm"
                >
                  <span>
                    {quantities[product.id]} × {product.name}
                    {product.variant ? ` ${product.variant}` : ""}
                  </span>

                  <span className="font-medium">
                    €
                    {(
                      (quantities[product.id] || 0) *
                      product.price
                    ).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/sales/new"
            className="mt-6 block w-full rounded-[22px] bg-[#722F37] px-5 py-4 font-semibold text-white"
          >
            Nuova vendita
          </Link>

          <Link
            href="/"
            className="mt-3 block w-full rounded-[22px] bg-white px-5 py-4 font-semibold shadow-sm"
          >
            Torna alla Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F3EA] text-[#27231F]">
      <div className="mx-auto max-w-md px-5 pb-40 pt-7">

        {/* HEADER */}
        <header>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">

              <div className="relative h-14 w-14 overflow-hidden rounded-[18px] bg-white shadow-sm">
                <Image
                  src="/logo-monteromola.png"
                  alt="Tenuta Monteromola"
                  fill
                  priority
                  className="object-contain p-1.5"
                />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#722F37]">
                  Tenuta Monteromola
                </p>

                <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                  Nuova vendita
                </h1>
              </div>
            </div>

            <Link
              href="/"
              className="rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm active:scale-95"
            >
              Chiudi
            </Link>
          </div>

          <p className="mt-5 text-sm leading-6 text-neutral-500">
            Seleziona i prodotti e registra la vendita.
          </p>
        </header>

        {/* CLIENTE */}
        <section className="mt-7 rounded-[28px] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#722F37]">
                Cliente
              </p>

              <h2 className="mt-1 text-lg font-semibold">
                Chi ha acquistato?
              </h2>
            </div>

            <span className="text-xs text-neutral-400">
              Opzionale
            </span>
          </div>

          <input
            type="text"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="Nome cliente"
            className="mt-4 w-full rounded-[18px] border border-black/5 bg-[#F7F3EA] px-4 py-4 text-base outline-none transition focus:border-[#722F37]/30"
          />
        </section>

        {/* VINI */}
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#722F37]">
                Prodotti
              </p>

              <h2 className="mt-1 text-2xl font-semibold">
                Vino
              </h2>
            </div>

            <span className="text-xs text-neutral-400">
              3 etichette
            </span>
          </div>

          <div className="space-y-3">
            {products
              .filter((product) => product.category === "wine")
              .map(renderProduct)}
          </div>
        </section>

        {/* MIELE */}
        <section className="mt-9">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#606C38]">
                Prodotti
              </p>

              <h2 className="mt-1 text-2xl font-semibold">
                Miele
              </h2>
            </div>

            <span className="text-xs text-neutral-400">
              3 varietà
            </span>
          </div>

          <div className="space-y-3">
            {products
              .filter((product) => product.category === "honey")
              .map(renderProduct)}
          </div>
        </section>

        {/* METODO DI PAGAMENTO */}
        <section className="mt-9 rounded-[28px] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#722F37]">
            Pagamento
          </p>

          <h2 className="mt-1 text-lg font-semibold">
            Metodo di pagamento
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {paymentMethods.map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`rounded-[18px] px-4 py-3.5 text-sm font-semibold transition active:scale-[0.97] ${
                  paymentMethod === method
                    ? "bg-[#722F37] text-white shadow-sm"
                    : "bg-[#F7F3EA] text-[#27231F]"
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </section>

        {/* STATO PAGAMENTO */}
        <section className="mt-4 rounded-[28px] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Stato
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentStatus("Pagato")}
              className={`rounded-[18px] px-4 py-3.5 text-sm font-semibold ${
                paymentStatus === "Pagato"
                  ? "bg-[#606C38] text-white"
                  : "bg-[#F7F3EA]"
              }`}
            >
              Pagato
            </button>

            <button
              type="button"
              onClick={() => setPaymentStatus("Da pagare")}
              className={`rounded-[18px] px-4 py-3.5 text-sm font-semibold ${
                paymentStatus === "Da pagare"
                  ? "bg-[#722F37] text-white"
                  : "bg-[#F7F3EA]"
              }`}
            >
              Da pagare
            </button>
          </div>
        </section>

        {/* SCATOLE */}
        <section className="mt-4 rounded-[28px] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Packaging
              </p>

              <h2 className="mt-1 text-lg font-semibold">
                Scatole
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setBoxQuantity((q) => Math.max(q - 1, 0))
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F3EA] text-xl"
              >
                −
              </button>

              <span className="w-6 text-center text-lg font-semibold">
                {boxQuantity}
              </span>

              <button
                type="button"
                onClick={() =>
                  setBoxQuantity((q) => q + 1)
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#722F37] text-xl text-white"
              >
                +
              </button>
            </div>

          </div>

          {boxQuantity > 0 && (
            <div className="mt-4">
              <label className="text-xs text-neutral-400">
                Costo per scatola
              </label>

              <div className="mt-2 flex items-center rounded-[18px] bg-[#F7F3EA] px-4">
                <span className="text-neutral-400">
                  €
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={boxCost}
                  onChange={(e) =>
                    setBoxCost(Number(e.target.value))
                  }
                  className="w-full bg-transparent px-2 py-4 outline-none"
                />
              </div>
            </div>
          )}
        </section>

        {/* NOTE */}
        <section className="mt-4 rounded-[28px] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Note
          </p>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Aggiungi una nota..."
            rows={3}
            className="mt-3 w-full resize-none rounded-[18px] bg-[#F7F3EA] px-4 py-4 outline-none"
          />
        </section>

        {/* RIEPILOGO */}
        {selectedProducts.length > 0 && (
          <section className="mt-8 rounded-[30px] bg-[#27231F] p-6 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/50">
                  Riepilogo
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {totalQuantity} prodotti
                </p>
              </div>

              <p className="text-3xl font-semibold tracking-tight">
                €{grandTotal.toFixed(2)}
              </p>
            </div>

            <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
              {selectedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between text-sm"
                >
                  <span className="text-white/75">
                    {quantities[product.id]} × {product.name}
                    {product.variant
                      ? ` ${product.variant}`
                      : ""}
                  </span>

                  <span>
                    €
                    {(
                      (quantities[product.id] || 0) *
                      product.price
                    ).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-white/10 pt-4">
              <div className="flex justify-between text-xs text-white/50">
                <span>
                  Cliente
                </span>

                <span>
                  {customer || "Vendita diretta"}
                </span>
              </div>

              <div className="mt-2 flex justify-between text-xs text-white/50">
                <span>
                  Pagamento
                </span>

                <span>
                  {paymentMethod}
                </span>
              </div>
            </div>
          </section>
        )}

        {errorMessage && (
          <p className="mt-5 text-center text-sm font-medium text-red-600">
            {errorMessage}
          </p>
        )}
      </div>

      {/* BOTTOM ACTION */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/5 bg-[#F7F3EA]/95 p-4 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur-xl">
        <div className="mx-auto max-w-md">
          <div className="mb-3 flex items-end justify-between px-1">
            <div>
              <p className="text-xs text-neutral-400">
                Totale vendita
              </p>

              <p className="text-2xl font-semibold tracking-tight">
                €{grandTotal.toFixed(2)}
              </p>
            </div>

            {totalQuantity > 0 && (
              <span className="rounded-full bg-[#722F37]/10 px-3 py-1 text-xs font-semibold text-[#722F37]">
                {totalQuantity} prodotti
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={saveSale}
            disabled={
              saving ||
              selectedProducts.length === 0
            }
            className="w-full rounded-[22px] bg-[#722F37] px-5 py-4 text-base font-semibold text-white shadow-lg transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
          >
            {saving
              ? "Salvataggio..."
              : "Registra vendita"}
          </button>
        </div>
      </div>

    </main>
  );
}