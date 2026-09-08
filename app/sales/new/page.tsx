"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  variant?: string;
  category: "wine" | "honey";
  price: number;
};

const products: Product[] = [
  {
    id: "onelia",
    name: "Onelia",
    category: "wine",
    price: 15,
  },
  {
    id: "gea",
    name: "Gea",
    category: "wine",
    price: 12,
  },
  {
    id: "giulio",
    name: "Giulio",
    category: "wine",
    price: 18,
  },
  {
    id: "acacia-250",
    name: "Acacia",
    variant: "250g",
    category: "honey",
    price: 6,
  },
  {
    id: "acacia-500",
    name: "Acacia",
    variant: "500g",
    category: "honey",
    price: 11,
  },
  {
    id: "millefiori-250",
    name: "Millefiori",
    variant: "250g",
    category: "honey",
    price: 6,
  },
  {
    id: "millefiori-500",
    name: "Millefiori",
    variant: "500g",
    category: "honey",
    price: 11,
  },
  {
    id: "melata-250",
    name: "Melata",
    variant: "250g",
    category: "honey",
    price: 7,
  },
  {
    id: "melata-500",
    name: "Melata",
    variant: "500g",
    category: "honey",
    price: 11,
  },
];

export default function NewSalePage() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showDetails, setShowDetails] = useState(false);

  const [customer, setCustomer] = useState("");

  const [boxQuantity, setBoxQuantity] = useState(0);
  const [boxCost, setBoxCost] = useState(0);

  const [paymentMethod, setPaymentMethod] = useState("Contanti");
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

  const total = products.reduce((sum, product) => {
    return sum + (quantities[product.id] || 0) * product.price;
  }, 0);

  const packagingTotal = boxQuantity * boxCost;
  const grandTotal = total + packagingTotal;

  const selectedProducts = products.filter(
    (product) => (quantities[product.id] || 0) > 0
  );

  const renderProduct = (product: Product) => {
    const quantity = quantities[product.id] || 0;

    return (
      <div
        key={product.id}
        className="rounded-3xl bg-white p-5 shadow-sm"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-semibold">
              {product.name}
            </p>

            {product.variant && (
              <p className="mt-1 text-sm text-neutral-500">
                {product.variant}
              </p>
            )}

            <p className="mt-2 text-sm font-medium text-[#722F37]">
              €{product.price.toFixed(2)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => decrease(product.id)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F7F3EA] text-xl font-medium"
            >
              −
            </button>

            <span className="w-6 text-center text-lg font-semibold">
              {quantity}
            </span>

            <button
              type="button"
              onClick={() => increase(product.id)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#722F37] text-xl font-medium text-white"
            >
              +
            </button>
          </div>
        </div>
      </div>
    );
  };

  const saveSale = async () => {
    if (selectedProducts.length === 0) return;

    try {
      setSaving(true);
      setSaved(false);
      setErrorMessage("");

      // 1. CREA L'ORDINE
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer: customer || null,
          total: grandTotal,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          box_quantity: boxQuantity,
          box_cost: boxCost,
          notes: notes || null,
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      // 2. CREA LE RIGHE DELL'ORDINE
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
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Errore durante il salvataggio."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F3EA] text-[#27231F]">
      <div className="mx-auto max-w-md px-5 py-8 pb-40">

        {/* HEADER */}
        <header className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#722F37]">
              Tenuta Monteromola
            </p>

            <h1 className="mt-3 text-3xl font-semibold">
              Nuova vendita
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              Seleziona i prodotti venduti.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-full bg-white px-4 py-2 text-sm shadow-sm"
          >
            Chiudi
          </Link>
        </header>

        {/* VINO */}
        <section className="mt-8">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#722F37]">
            Vino
          </p>

          <div className="space-y-3">
            {products
              .filter((product) => product.category === "wine")
              .map(renderProduct)}
          </div>
        </section>

        {/* MIELE */}
        <section className="mt-9">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#606C38]">
            Miele
          </p>

          <div className="space-y-3">
            {products
              .filter((product) => product.category === "honey")
              .map(renderProduct)}
          </div>
        </section>

        {/* RIEPILOGO PRODOTTI */}
        {selectedProducts.length > 0 && (
          <section className="mt-9 rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-500">
              Riepilogo
            </p>

            <div className="mt-4 space-y-2">
              {selectedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between text-sm"
                >
                  <span>
                    {quantities[product.id]} × {product.name}
                    {product.variant ? ` ${product.variant}` : ""}
                  </span>

                  <span>
                    €
                    {(
                      (quantities[product.id] || 0) * product.price
                    ).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* DETTAGLI VENDITA */}
        {showDetails && (
          <section className="mt-9 rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">
              Dettagli vendita
            </h2>

            <div className="mt-5 space-y-5">

              {/* CLIENTE */}
              <div>
                <label className="mb-2 block text-sm text-neutral-500">
                  Cliente
                </label>

                <input
                  type="text"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="Nome cliente (opzionale)"
                  className="w-full rounded-2xl border border-black/10 bg-[#F7F3EA] px-4 py-3 outline-none"
                />
              </div>

              {/* SCATOLE */}
              <div>
                <label className="mb-2 block text-sm text-neutral-500">
                  Scatole
                </label>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setBoxQuantity((q) => Math.max(q - 1, 0))
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F7F3EA] text-xl"
                  >
                    −
                  </button>

                  <span className="w-8 text-center text-lg font-semibold">
                    {boxQuantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => setBoxQuantity((q) => q + 1)}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-[#722F37] text-xl text-white"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* COSTO SCATOLA */}
              <div>
                <label className="mb-2 block text-sm text-neutral-500">
                  Costo scatola
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={boxCost}
                  onChange={(e) =>
                    setBoxCost(Number(e.target.value))
                  }
                  className="w-full rounded-2xl border border-black/10 bg-[#F7F3EA] px-4 py-3 outline-none"
                />
              </div>

              {/* METODO PAGAMENTO */}
              <div>
                <label className="mb-2 block text-sm text-neutral-500">
                  Metodo di pagamento
                </label>

                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value)
                  }
                  className="w-full rounded-2xl border border-black/10 bg-[#F7F3EA] px-4 py-3 outline-none"
                >
                  <option>Contanti</option>
                  <option>Bonifico</option>
                  <option>Carta</option>
                  <option>Altro</option>
                </select>
              </div>

              {/* STATO PAGAMENTO */}
              <div>
                <label className="mb-2 block text-sm text-neutral-500">
                  Stato pagamento
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus("Pagato")}
                    className={`rounded-2xl px-4 py-3 ${
                      paymentStatus === "Pagato"
                        ? "bg-[#722F37] text-white"
                        : "bg-[#F7F3EA]"
                    }`}
                  >
                    Pagato
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPaymentStatus("Da pagare")
                    }
                    className={`rounded-2xl px-4 py-3 ${
                      paymentStatus === "Da pagare"
                        ? "bg-[#722F37] text-white"
                        : "bg-[#F7F3EA]"
                    }`}
                  >
                    Da pagare
                  </button>
                </div>
              </div>

              {/* NOTE */}
              <div>
                <label className="mb-2 block text-sm text-neutral-500">
                  Note
                </label>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Note opzionali"
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-black/10 bg-[#F7F3EA] px-4 py-3 outline-none"
                />
              </div>

              {/* TOTALI */}
              <div className="border-t border-black/5 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">
                    Prodotti
                  </span>

                  <span>
                    €{total.toFixed(2)}
                  </span>
                </div>

                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-neutral-500">
                    Scatole
                  </span>

                  <span>
                    €{packagingTotal.toFixed(2)}
                  </span>
                </div>

                <div className="mt-4 flex justify-between text-lg font-semibold">
                  <span>
                    Totale
                  </span>

                  <span>
                    €{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* BARRA FISSA IN BASSO */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-black/5 bg-[#F7F3EA]/95 p-4 backdrop-blur">
          <div className="mx-auto max-w-md">

            <div className="mb-3 flex items-center justify-between px-1">
              <span className="text-sm text-neutral-500">
                Totale
              </span>

              <span className="text-2xl font-semibold">
                €{grandTotal.toFixed(2)}
              </span>
            </div>

            {!showDetails ? (
              <button
                type="button"
                disabled={selectedProducts.length === 0}
                onClick={() => setShowDetails(true)}
                className="w-full rounded-2xl bg-[#722F37] px-5 py-4 text-lg font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-30"
              >
                Continua
              </button>
            ) : (
              <>
                {errorMessage && (
                  <p className="mb-3 text-center text-sm text-red-600">
                    {errorMessage}
                  </p>
                )}

                <button
                  type="button"
                  onClick={saveSale}
                  disabled={saving || saved}
                  className="w-full rounded-2xl bg-[#722F37] px-5 py-4 text-lg font-medium text-white shadow-sm disabled:opacity-50"
                >
                  {saving
                    ? "Salvataggio..."
                    : saved
                      ? "Vendita registrata ✓"
                      : "Registra vendita"}
                </button>

                {saved && (
                  <p className="mt-2 text-center text-sm font-medium text-[#606C38]">
                    Vendita salvata correttamente.
                  </p>
                )}
              </>
            )}

          </div>
        </div>

      </div>
    </main>
  );
}