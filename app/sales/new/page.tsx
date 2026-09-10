"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Minus,
  Plus,
  ShoppingBag,
  Package,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";

type Product = {
  id: string;
  name: string;
  variant?: string;
  category: "wine" | "honey" | "packaging";
  image?: string;
};

type InventoryRow = {
  product_id: string;
  product_name: string;
  variant: string | null;
  category: string;
  quantity: number;
  price: number;
};

type InventoryData = {
  quantity: number;
  price: number;
};

const products: Product[] = [
  {
    id: "onelia",
    name: "Onelia",
    category: "wine",
    image: "/onelia.png",
  },
  {
    id: "gea",
    name: "Gea",
    category: "wine",
    image: "/gea.png",
  },
  {
    id: "giulio",
    name: "Giulio",
    category: "wine",
    image: "/giulio.png",
  },

  {
    id: "acacia-250",
    name: "Acacia",
    variant: "250g",
    category: "honey",
    image: "/acacia.png",
  },
  {
    id: "acacia-500",
    name: "Acacia",
    variant: "500g",
    category: "honey",
    image: "/acacia.png",
  },

  {
    id: "millefiori-250",
    name: "Millefiori",
    variant: "250g",
    category: "honey",
    image: "/millefiori.png",
  },
  {
    id: "millefiori-500",
    name: "Millefiori",
    variant: "500g",
    category: "honey",
    image: "/millefiori.png",
  },

  {
    id: "melata-250",
    name: "Melata",
    variant: "250g",
    category: "honey",
    image: "/melata.png",
  },
  {
    id: "melata-500",
    name: "Melata",
    variant: "500g",
    category: "honey",
    image: "/melata.png",
  },

  {
    id: "box-wine",
    name: "Scatola vino",
    category: "packaging",
  },
  {
    id: "box-honey",
    name: "Scatola miele",
    category: "packaging",
  },
];

export default function NewSalePage() {
  const [customer, setCustomer] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState("Contanti");
  const [notes, setNotes] = useState("");

  const [quantities, setQuantities] = useState<
    Record<string, number>
  >({});

  const [inventory, setInventory] = useState<
    Record<string, InventoryData>
  >({});

  const [loadingInventory, setLoadingInventory] =
    useState(true);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    try {
      setLoadingInventory(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("inventory")
        .select(`
          product_id,
          product_name,
          variant,
          category,
          quantity,
          price
        `);

      if (error) {
        throw error;
      }

      const stock: Record<string, InventoryData> = {};

      ((data || []) as InventoryRow[]).forEach((row) => {
        stock[row.product_id] = {
          quantity: Number(row.quantity) || 0,
          price: Number(row.price) || 0,
        };
      });

      setInventory(stock);
    } catch (error) {
      console.error(error);

      setErrorMessage(
        "Non è stato possibile caricare prodotti e prezzi."
      );
    } finally {
      setLoadingInventory(false);
    }
  }

  function getQuantity(productId: string) {
    return quantities[productId] || 0;
  }

  function getAvailable(productId: string) {
    return inventory[productId]?.quantity || 0;
  }

  function getPrice(productId: string) {
    return inventory[productId]?.price || 0;
  }

  function increase(product: Product) {
    const current = getQuantity(product.id);

    if (product.category !== "packaging") {
      const available = getAvailable(product.id);

      if (current >= available) {
        return;
      }
    }

    setQuantities((prev) => ({
      ...prev,
      [product.id]: current + 1,
    }));
  }

  function decrease(productId: string) {
    const current = getQuantity(productId);

    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(current - 1, 0),
    }));
  }

  const selectedItems = useMemo(() => {
    return products
      .filter(
        (product) =>
          (quantities[product.id] || 0) > 0
      )
      .map((product) => ({
        ...product,
        quantity: quantities[product.id] || 0,
        price: inventory[product.id]?.price || 0,
      }));
  }, [quantities, inventory]);

  const saleTotal = useMemo(() => {
    return selectedItems.reduce(
      (sum, item) =>
        sum + item.price * item.quantity,
      0
    );
  }, [selectedItems]);

  const selectedQuantity = useMemo(() => {
    return selectedItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  }, [selectedItems]);

  const selectedProductsOnly = selectedItems.filter(
    (item) => item.category !== "packaging"
  );

  const selectedPackaging = selectedItems.filter(
    (item) => item.category === "packaging"
  );

  const currentWineStock = products
    .filter((product) => product.category === "wine")
    .reduce(
      (sum, product) =>
        sum + getAvailable(product.id),
      0
    );

  const currentHoneyStock = products
    .filter((product) => product.category === "honey")
    .reduce(
      (sum, product) =>
        sum + getAvailable(product.id),
      0
    );

  const remainingWineStock = products
    .filter((product) => product.category === "wine")
    .reduce((sum, product) => {
      const available = getAvailable(product.id);
      const selling = getQuantity(product.id);

      return sum + Math.max(available - selling, 0);
    }, 0);

  const remainingHoneyStock = products
    .filter((product) => product.category === "honey")
    .reduce((sum, product) => {
      const available = getAvailable(product.id);
      const selling = getQuantity(product.id);

      return sum + Math.max(available - selling, 0);
    }, 0);

  const totalRemaining =
    remainingWineStock + remainingHoneyStock;

  async function saveSale() {
    if (selectedItems.length === 0) {
      setErrorMessage(
        "Seleziona almeno un prodotto."
      );
      return;
    }

    for (const item of selectedProductsOnly) {
      const available = getAvailable(item.id);

      if (item.quantity > available) {
        setErrorMessage(
          `Magazzino insufficiente per ${item.name}${
            item.variant
              ? ` ${item.variant}`
              : ""
          }.`
        );

        return;
      }
    }

    for (const item of selectedItems) {
      if (item.price < 0) {
        setErrorMessage(
          `Controlla il prezzo di ${item.name}.`
        );
        return;
      }
    }

    try {
      setSaving(true);
      setErrorMessage("");

      /*
       * 1. CREA LA VENDITA
       */

      const { data: order, error: orderError } =
        await supabase
          .from("orders")
          .insert({
            order_date: new Date().toISOString(),
            customer:
              customer.trim() || "Cliente",
            total: saleTotal,
            payment_method: paymentMethod,
            payment_status: "Pagato",
            box_quantity: selectedPackaging.reduce(
              (sum, item) =>
                sum + item.quantity,
              0
            ),
            box_cost: selectedPackaging.reduce(
              (sum, item) =>
                sum +
                item.quantity * item.price,
              0
            ),
            notes: notes.trim() || null,
          })
          .select()
          .single();

      if (orderError) {
        throw orderError;
      }

      /*
       * 2. SALVA TUTTI GLI ARTICOLI
       */

      const orderItems = selectedItems.map(
        (item) => ({
          order_id: order.id,
          product_id: item.id,
          product_name: item.name,
          variant: item.variant || null,
          category: item.category,
          quantity: item.quantity,
          unit_price: item.price,
        })
      );

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        throw itemsError;
      }

      /*
       * 3. SCALA SOLO VINO E MIELE DAL MAGAZZINO
       */

      for (const item of selectedProductsOnly) {
        const { error: stockError } =
          await supabase.rpc(
            "decrement_inventory",
            {
              p_product_id: item.id,
              p_quantity: item.quantity,
            }
          );

        if (stockError) {
          throw stockError;
        }
      }

      /*
       * 4. RICARICA STOCK
       */

      await loadInventory();

      setSuccess(true);
    } catch (error: any) {
      console.error(error);

      setErrorMessage(
        error?.message ||
          "Errore durante la registrazione della vendita."
      );
    } finally {
      setSaving(false);
    }
  }

  function resetSale() {
    setCustomer("");
    setPaymentMethod("Contanti");
    setNotes("");
    setQuantities({});
    setSuccess(false);
    setErrorMessage("");

    loadInventory();
  }

  function ProductCard({
    product,
  }: {
    product: Product;
  }) {
    const quantity = getQuantity(product.id);
    const price = getPrice(product.id);

    const isPackaging =
      product.category === "packaging";

    const available = isPackaging
      ? null
      : getAvailable(product.id);

    const remaining =
      available === null
        ? null
        : Math.max(available - quantity, 0);

    const soldOut =
      !isPackaging && available === 0;

    return (
      <div className="rounded-[25px] bg-white p-4 shadow-[0_8px_30px_rgba(30,26,21,0.035)]">

        <div className="flex items-center gap-4">

          <div
            className={`relative flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-[20px] ${
              product.category === "wine"
                ? "bg-[#F2EEE6]"
                : product.category === "honey"
                ? "bg-[#F3F0E3]"
                : "bg-[#EEEAE4]"
            }`}
          >

            {isPackaging ? (
              <Package
                size={30}
                strokeWidth={1.5}
                className="text-[#6F2636]"
              />
            ) : (
              <Image
                src={product.image!}
                alt={product.name}
                fill
                className="object-contain p-1"
              />
            )}

          </div>

          <div className="min-w-0 flex-1">

            <p className="font-semibold">
              {product.name}
            </p>

            <p className="mt-1 text-xs text-[#89837B]">
              {product.variant
                ? `${product.variant} · `
                : ""}
              €{price.toFixed(2)}
            </p>

            {!isPackaging && (
              <p
                className={`mt-2 text-xs font-semibold ${
                  soldOut
                    ? "text-red-500"
                    : (remaining || 0) <= 5
                    ? "text-orange-500"
                    : "text-[#657052]"
                }`}
              >
                {soldOut
                  ? "Esaurito"
                  : `${available} disponibili`}
              </p>
            )}

            {isPackaging && (
              <p className="mt-2 text-xs font-semibold text-[#8C7563]">
                Confezione
              </p>
            )}

          </div>

        </div>

        <div className="mt-4 flex items-center justify-between">

          <div>

            {!isPackaging && (
              <>
                <p className="text-[10px] uppercase tracking-widest text-[#969087]">
                  Dopo vendita
                </p>

                <p className="mt-1 text-sm font-semibold">
                  {remaining} rimasti
                </p>
              </>
            )}

            {isPackaging && (
              <>
                <p className="text-[10px] uppercase tracking-widest text-[#969087]">
                  Totale scatole
                </p>

                <p className="mt-1 text-sm font-semibold">
                  €{(price * quantity).toFixed(2)}
                </p>
              </>
            )}

          </div>

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() =>
                decrease(product.id)
              }
              disabled={quantity === 0}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F1EEE7] disabled:opacity-30"
            >
              <Minus size={18} />
            </button>

            <div className="w-8 text-center text-lg font-semibold">
              {quantity}
            </div>

            <button
              type="button"
              onClick={() =>
                increase(product)
              }
              disabled={
                soldOut ||
                (!isPackaging &&
                  quantity >= (available || 0))
              }
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6F2636] text-white disabled:opacity-30"
            >
              <Plus size={18} />
            </button>

          </div>

        </div>

      </div>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[#FCFAF5] px-5 pb-32 pt-10 text-[#211F1C]">

        <div className="mx-auto max-w-md">

          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#657052] text-white">
              <Check size={38} />
            </div>
          </div>

          <h1 className="monteromola-serif mt-7 text-center text-[38px] leading-tight">
            Vendita registrata
          </h1>

          <p className="mt-3 text-center text-sm text-[#817B73]">
            Vendita e magazzino aggiornati.
          </p>

          <div className="mt-8 rounded-[28px] bg-[#6F2636] p-6 text-white">

            <p className="text-xs uppercase tracking-[0.18em] text-white/55">
              Totale vendita
            </p>

            <p className="monteromola-serif mt-2 text-[45px]">
              €{saleTotal.toFixed(2)}
            </p>

            <p className="mt-2 text-sm text-white/60">
              {selectedQuantity} articoli
            </p>

          </div>

          <div className="mt-5 rounded-[28px] bg-white p-6 shadow-sm">

            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#657052]">
              Magazzino aggiornato
            </p>

            <div className="mt-4 flex items-end justify-between">

              <div>

                <p className="text-sm text-[#8A847D]">
                  Prodotti rimanenti
                </p>

                <p className="monteromola-serif mt-1 text-[45px]">
                  {currentWineStock +
                    currentHoneyStock}
                </p>

              </div>

              <ShoppingBag
                size={34}
                className="text-[#6F2636]"
              />

            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">

              <div className="rounded-[18px] bg-[#F7F3ED] p-4">
                <p className="text-xs text-[#918B83]">
                  Vino
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {currentWineStock}
                </p>
              </div>

              <div className="rounded-[18px] bg-[#F4F5EE] p-4">
                <p className="text-xs text-[#918B83]">
                  Miele
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {currentHoneyStock}
                </p>
              </div>

            </div>

          </div>

          <button
            type="button"
            onClick={resetSale}
            className="mt-7 w-full rounded-[20px] bg-[#6F2636] px-5 py-4 font-semibold text-white"
          >
            Registra un'altra vendita
          </button>

          <Link
            href="/"
            className="mt-3 flex w-full items-center justify-center rounded-[20px] border border-[#6F2636]/15 bg-white px-5 py-4 font-semibold text-[#6F2636]"
          >
            Torna alla home
          </Link>

        </div>

        <BottomNav />

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FCFAF5] text-[#211F1C]">

      <div className="mx-auto max-w-md px-5 pb-40 pt-6">

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
            Nuova vendita
          </h1>

        </header>

        <section className="mt-7 rounded-[28px] bg-[#211F1C] p-5 text-white">

          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
            Magazzino
          </p>

          {loadingInventory ? (
            <p className="mt-3 text-sm text-white/60">
              Caricamento...
            </p>
          ) : (
            <>
              <div className="mt-3 flex items-end justify-between">

                <div>
                  <p className="monteromola-serif text-[42px] leading-none">
                    {totalRemaining}
                  </p>

                  <p className="mt-2 text-xs text-white/50">
                    rimanenti dopo questa vendita
                  </p>
                </div>

                <ShoppingBag
                  size={29}
                  className="text-white/60"
                />

              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">

                <div className="rounded-[18px] bg-white/10 p-3">
                  <p className="text-xs text-white/50">
                    Vino
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    {remainingWineStock}
                  </p>
                </div>

                <div className="rounded-[18px] bg-white/10 p-3">
                  <p className="text-xs text-white/50">
                    Miele
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    {remainingHoneyStock}
                  </p>
                </div>

              </div>
            </>
          )}

        </section>

        <section className="mt-8">

          <label className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8B857D]">
            Cliente
          </label>

          <input
            type="text"
            value={customer}
            onChange={(e) =>
              setCustomer(e.target.value)
            }
            placeholder="Nome cliente"
            className="mt-2 h-14 w-full rounded-[18px] border border-black/[0.06] bg-white px-4 text-sm outline-none focus:border-[#6F2636]/30"
          />

        </section>

        <section className="mt-9">

          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6F2636]">
            Cantina
          </p>

          <h2 className="monteromola-serif mt-1 text-[29px]">
            Vini
          </h2>

          <div className="mt-4 space-y-3">

            {products
              .filter(
                (product) =>
                  product.category === "wine"
              )
              .map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}

          </div>

        </section>

        <section className="mt-10">

          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#657052]">
            Dalla Tenuta
          </p>

          <h2 className="monteromola-serif mt-1 text-[29px]">
            Miele
          </h2>

          <div className="mt-4 space-y-3">

            {products
              .filter(
                (product) =>
                  product.category === "honey"
              )
              .map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}

          </div>

        </section>

        <section className="mt-10">

          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C7563]">
            Packaging
          </p>

          <h2 className="monteromola-serif mt-1 text-[29px]">
            Scatole
          </h2>

          <div className="mt-4 space-y-3">

            {products
              .filter(
                (product) =>
                  product.category === "packaging"
              )
              .map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}

          </div>

        </section>

        <section className="mt-10">

          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8B857D]">
            Pagamento
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3">

            {[
              "Contanti",
              "POS",
              "Bonifico",
              "Altro",
            ].map((method) => (
              <button
                key={method}
                type="button"
                onClick={() =>
                  setPaymentMethod(method)
                }
                className={`rounded-[17px] border px-4 py-3 text-sm font-semibold ${
                  paymentMethod === method
                    ? "border-[#6F2636] bg-[#6F2636] text-white"
                    : "border-black/[0.06] bg-white text-[#514C46]"
                }`}
              >
                {method}
              </button>
            ))}

          </div>

        </section>

        <section className="mt-8">

          <label className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8B857D]">
            Note
          </label>

          <textarea
            value={notes}
            onChange={(e) =>
              setNotes(e.target.value)
            }
            placeholder="Note opzionali..."
            rows={3}
            className="mt-2 w-full resize-none rounded-[18px] border border-black/[0.06] bg-white p-4 text-sm outline-none focus:border-[#6F2636]/30"
          />

        </section>

        {errorMessage && (
          <div className="mt-6 rounded-[18px] bg-red-50 p-4 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        <section className="mt-8 rounded-[28px] bg-white p-5 shadow-sm">

          <div className="flex justify-between text-sm">
            <span className="text-[#8C867F]">
              Articoli
            </span>

            <span className="font-semibold">
              {selectedQuantity}
            </span>
          </div>

          <div className="mt-3 flex justify-between text-sm">
            <span className="text-[#8C867F]">
              Rimanenza magazzino
            </span>

            <span className="font-semibold">
              {totalRemaining}
            </span>
          </div>

          <div className="mt-5 border-t border-black/[0.06] pt-5">

            <div className="flex items-end justify-between">

              <span className="font-semibold">
                Totale
              </span>

              <span className="monteromola-serif text-[34px] text-[#6F2636]">
                €{saleTotal.toFixed(2)}
              </span>

            </div>

          </div>

        </section>

        <button
          type="button"
          onClick={saveSale}
          disabled={
            saving ||
            selectedItems.length === 0
          }
          className="mt-5 w-full rounded-[22px] bg-[#6F2636] px-5 py-[18px] font-semibold text-white shadow-[0_10px_30px_rgba(111,38,54,0.2)] disabled:opacity-40"
        >
          {saving
            ? "Registrazione..."
            : `Registra vendita · €${saleTotal.toFixed(
                2
              )}`}
        </button>

      </div>

      <BottomNav />

    </main>
  );
}