"use client";

import Image from "next/image";
import Link from "next/link";

import { useState } from "react";
import {
  ArrowLeft,
  Banknote,
  CreditCard,
  Landmark,
  MoreHorizontal,
  Check,
} from "lucide-react";

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

const payments = [
  {
    name: "Contanti",
    icon: Banknote,
  },
  {
    name: "POS",
    icon: CreditCard,
  },
  {
    name: "Bonifico",
    icon: Landmark,
  },
  {
    name: "Altro",
    icon: MoreHorizontal,
  },
];

export default function NewSalePage() {
  const [quantities, setQuantities] =
    useState<Record<string, number>>({});

  const [customer, setCustomer] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState("Contanti");

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

  const total = products.reduce((sum, product) => {
    return (
      sum +
      (quantities[product.id] || 0) * product.price
    );
  }, 0);

  const totalQuantity = selectedProducts.reduce(
    (sum, product) =>
      sum + (quantities[product.id] || 0),
    0
  );

  const saveSale = async () => {
    if (selectedProducts.length === 0) return;

    try {
      setSaving(true);
      setErrorMessage("");

      const { data: order, error: orderError } =
        await supabase
          .from("orders")
          .insert({
            customer: customer.trim() || null,
            total,
            payment_method: paymentMethod,
            payment_status: "Pagato",
            box_quantity: 0,
            box_cost: 0,
            notes: notes.trim() || null,
          })
          .select()
          .single();

      if (orderError) throw orderError;

      const items = selectedProducts.map(
        (product) => ({
          order_id: order.id,
          product_id: product.id,
          product_name: product.name,
          variant: product.variant || null,
          category: product.category,
          quantity: quantities[product.id] || 0,
          unit_price: product.price,
        })
      );

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(items);

      if (itemsError) throw itemsError;

      setSaved(true);
    } catch (error: any) {
      console.error(error);

      setErrorMessage(
        error?.message ||
          "Errore durante il salvataggio."
      );
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FCFAF5] px-6 text-[#211F1C]">
        <div className="w-full max-w-sm text-center">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#657052]/10 text-[#657052]">
            <Check size={38} strokeWidth={1.8} />
          </div>

          <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6F2636]">
            Tenuta Monteromola
          </p>

          <h1 className="monteromola-serif mt-2 text-[40px] leading-none">
            Vendita
            <br />
            registrata.
          </h1>

          <p className="monteromola-serif mt-7 text-[53px] text-[#6F2636]">
            €{total.toFixed(0)}
          </p>

          <Link
            href="/sales/new"
            className="mt-9 block rounded-[22px] bg-[#211F1C] px-5 py-4 font-semibold text-white"
          >
            Nuova vendita
          </Link>

          <Link
            href="/"
            className="mt-3 block rounded-[22px] bg-white px-5 py-4 font-semibold shadow-sm"
          >
            Torna alla Home
          </Link>

        </div>
      </main>
    );
  }

  const renderProduct = (product: Product) => {
    const quantity = quantities[product.id] || 0;

    return (
      <div
        key={product.id}
        className="flex items-center gap-4 border-b border-black/[0.045] py-4 last:border-0"
      >
        <div
          className={`relative h-[62px] w-[62px] shrink-0 overflow-hidden rounded-[18px] ${
            product.category === "wine"
              ? "bg-[#EFE7DC]"
              : "bg-[#F0EDDF]"
          }`}
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain p-1"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {product.name}
          </p>

          <div className="mt-1 flex items-center gap-2">
            {product.variant && (
              <span className="text-xs text-[#99938A]">
                {product.variant}
              </span>
            )}

            <span className="text-xs font-semibold text-[#6F2636]">
              €{product.price}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => decrease(product.id)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F2EFE8] text-lg"
          >
            −
          </button>

          <span className="w-5 text-center text-sm font-semibold">
            {quantity}
          </span>

          <button
            onClick={() => increase(product.id)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6F2636] text-lg text-white"
          >
            +
          </button>
        </div>
      </div>
    );
  };

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
                alt="Monteromola"
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
            Nuova vendita
          </h1>
        </header>

        {/* CLIENT */}
        <section className="mt-8">
          <p className="text-xs font-semibold text-[#5E5953]">
            Cliente
          </p>

          <input
            type="text"
            value={customer}
            onChange={(e) =>
              setCustomer(e.target.value)
            }
            placeholder="Vendita diretta"
            className="mt-2 w-full rounded-[20px] border border-black/[0.05] bg-white px-4 py-4 text-sm outline-none placeholder:text-[#AAA49B]"
          />
        </section>

        {/* WINE */}
        <section className="mt-9">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.19em] text-[#6F2636]">
              Cantina
            </p>

            <h2 className="monteromola-serif mt-1 text-[28px]">
              Vino
            </h2>
          </div>

          <div className="mt-3 rounded-[28px] bg-white px-4 shadow-[0_8px_30px_rgba(30,26,21,0.035)]">
            {products
              .filter(
                (product) =>
                  product.category === "wine"
              )
              .map(renderProduct)}
          </div>
        </section>

        {/* HONEY */}
        <section className="mt-9">
          <p className="text-[10px] font-semibold uppercase tracking-[0.19em] text-[#657052]">
            Dalla Tenuta
          </p>

          <h2 className="monteromola-serif mt-1 text-[28px]">
            Miele
          </h2>

          <div className="mt-3 rounded-[28px] bg-white px-4 shadow-[0_8px_30px_rgba(30,26,21,0.035)]">
            {products
              .filter(
                (product) =>
                  product.category === "honey"
              )
              .map(renderProduct)}
          </div>
        </section>

        {/* PAYMENT */}
        <section className="mt-9">
          <p className="text-[10px] font-semibold uppercase tracking-[0.19em] text-[#8F8980]">
            Checkout
          </p>

          <h2 className="monteromola-serif mt-1 text-[28px]">
            Pagamento
          </h2>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {payments.map((method) => {
              const Icon = method.icon;

              const selected =
                paymentMethod === method.name;

              return (
                <button
                  key={method.name}
                  onClick={() =>
                    setPaymentMethod(method.name)
                  }
                  className={`flex flex-col items-center gap-2 rounded-[20px] px-2 py-4 text-[10px] font-semibold ${
                    selected
                      ? "bg-[#6F2636] text-white"
                      : "bg-white text-[#5D5954]"
                  }`}
                >
                  <Icon
                    size={19}
                    strokeWidth={1.7}
                  />

                  {method.name}
                </button>
              );
            })}
          </div>
        </section>

        {/* NOTES */}
        <section className="mt-8">
          <p className="text-xs font-semibold text-[#5E5953]">
            Note
          </p>

          <textarea
            value={notes}
            onChange={(e) =>
              setNotes(e.target.value)
            }
            placeholder="Aggiungi una nota..."
            rows={3}
            className="mt-2 w-full resize-none rounded-[20px] border border-black/[0.05] bg-white px-4 py-4 text-sm outline-none"
          />
        </section>

        {errorMessage && (
          <p className="mt-5 text-center text-sm text-red-600">
            {errorMessage}
          </p>
        )}

      </div>

      {/* CHECKOUT BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/[0.045] bg-[#FCFAF5]/95 px-5 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-4 backdrop-blur-2xl">

        <div className="mx-auto max-w-md">

          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#979188]">
                {totalQuantity} prodotti
              </p>

              <p className="monteromola-serif mt-1 text-[31px] leading-none">
                €{total.toFixed(2)}
              </p>
            </div>

            {customer && (
              <p className="max-w-[130px] truncate text-xs text-[#858078]">
                {customer}
              </p>
            )}
          </div>

          <button
            onClick={saveSale}
            disabled={
              saving ||
              selectedProducts.length === 0
            }
            className="w-full rounded-[22px] bg-[#6F2636] px-5 py-[17px] font-semibold text-white shadow-[0_10px_30px_rgba(111,38,54,0.22)] disabled:opacity-30"
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