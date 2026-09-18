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
  Gift,
  Percent,
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

  // SCATOLE VINO

  {
    id: "box-wine-1",
    name: "Scatola vino 1",
    variant: "Tipo 1",
    category: "packaging",
    image: "/scatolavino1.png",
  },
  {
    id: "box-wine-2",
    name: "Scatola vino 2",
    variant: "Tipo 2",
    category: "packaging",
    image: "/scatolavino2.png",
  },
  {
    id: "box-wine-3",
    name: "Scatola vino 3",
    variant: "Tipo 3",
    category: "packaging",
    image: "/scatolavino3.png",
  },

  // SCATOLE MIELE

  {
    id: "box-honey-1",
    name: "Scatola miele 1",
    variant: "Tipo 1",
    category: "packaging",
    image: "/scatolamiele1.png",
  },
  {
    id: "box-honey-2",
    name: "Scatola miele 2",
    variant: "Tipo 2",
    category: "packaging",
    image: "/scatolamiele2.png",
  },
];

export default function NewSalePage() {
  const [customer, setCustomer] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("Contanti");

  const [notes, setNotes] = useState("");

  const [discountPercent, setDiscountPercent] =
    useState(0);

  const [isGift, setIsGift] = useState(false);

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
  const [errorMessage, setErrorMessage] =
    useState("");

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

      const stock: Record<
        string,
        InventoryData
      > = {};

      ((data || []) as InventoryRow[]).forEach(
        (row) => {
          stock[row.product_id] = {
            quantity:
              Number(row.quantity) || 0,

            price:
              Number(row.price) || 0,
          };
        }
      );

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
    const current =
      getQuantity(product.id);

    const available =
      getAvailable(product.id);

    if (current >= available) {
      return;
    }

    setQuantities((prev) => ({
      ...prev,
      [product.id]: current + 1,
    }));
  }

  function decrease(productId: string) {
    const current =
      getQuantity(productId);

    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(
        current - 1,
        0
      ),
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

        quantity:
          quantities[product.id] || 0,

        price:
          inventory[product.id]?.price || 0,
      }));
  }, [quantities, inventory]);

  /*
   * VALORE PRIMA DELLO SCONTO
   */

  const subtotal = useMemo(() => {
    return selectedItems.reduce(
      (sum, item) =>
        sum +
        item.price * item.quantity,
      0
    );
  }, [selectedItems]);

  /*
   * SCONTO
   */

  const discountAmount = useMemo(() => {
    if (isGift) {
      return subtotal;
    }

    return (
      subtotal *
      (discountPercent / 100)
    );
  }, [
    subtotal,
    discountPercent,
    isGift,
  ]);

  /*
   * TOTALE EFFETTIVAMENTE INCASSATO
   */

  const saleTotal = useMemo(() => {
    if (isGift) {
      return 0;
    }

    return Math.max(
      subtotal - discountAmount,
      0
    );
  }, [
    subtotal,
    discountAmount,
    isGift,
  ]);

  const selectedQuantity = useMemo(() => {
    return selectedItems.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );
  }, [selectedItems]);

  const selectedPackaging =
    selectedItems.filter(
      (item) =>
        item.category === "packaging"
    );

  /*
   * STOCK
   */

  const currentWineStock = products
    .filter(
      (product) =>
        product.category === "wine"
    )
    .reduce(
      (sum, product) =>
        sum +
        getAvailable(product.id),
      0
    );

  const currentHoneyStock = products
    .filter(
      (product) =>
        product.category === "honey"
    )
    .reduce(
      (sum, product) =>
        sum +
        getAvailable(product.id),
      0
    );

  const currentPackagingStock = products
    .filter(
      (product) =>
        product.category === "packaging"
    )
    .reduce(
      (sum, product) =>
        sum +
        getAvailable(product.id),
      0
    );

  const remainingWineStock = products
    .filter(
      (product) =>
        product.category === "wine"
    )
    .reduce((sum, product) => {
      const available =
        getAvailable(product.id);

      const selling =
        getQuantity(product.id);

      return (
        sum +
        Math.max(
          available - selling,
          0
        )
      );
    }, 0);

  const remainingHoneyStock = products
    .filter(
      (product) =>
        product.category === "honey"
    )
    .reduce((sum, product) => {
      const available =
        getAvailable(product.id);

      const selling =
        getQuantity(product.id);

      return (
        sum +
        Math.max(
          available - selling,
          0
        )
      );
    }, 0);

  const remainingPackagingStock = products
    .filter(
      (product) =>
        product.category === "packaging"
    )
    .reduce((sum, product) => {
      const available =
        getAvailable(product.id);

      const selling =
        getQuantity(product.id);

      return (
        sum +
        Math.max(
          available - selling,
          0
        )
      );
    }, 0);

  const totalRemaining =
    remainingWineStock +
    remainingHoneyStock +
    remainingPackagingStock;

  /*
   * REGISTRA VENDITA
   */

  async function saveSale() {
    if (selectedItems.length === 0) {
      setErrorMessage(
        "Seleziona almeno un prodotto."
      );

      return;
    }

    /*
     * Controllo magazzino per TUTTI
     * gli articoli, scatole comprese.
     */

    for (const item of selectedItems) {
      const available =
        getAvailable(item.id);

      if (item.quantity > available) {
        setErrorMessage(
          `Magazzino insufficiente per ${
            item.name
          }${
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
       * 1. CREA ORDINE
       */

      const {
        data: order,
        error: orderError,
      } = await supabase
        .from("orders")
        .insert({
          order_date:
            new Date().toISOString(),

          customer:
            customer.trim() ||
            "Cliente",

          /*
           * Valore prodotti prima
           * di sconto/regalo.
           */
          subtotal,

          /*
           * Se è regalo non registriamo
           * anche uno sconto.
           */
          discount_percent:
            isGift
              ? 0
              : discountPercent,

          is_gift: isGift,

          /*
           * Incasso effettivo.
           * Per regalo = 0.
           */
          total: saleTotal,

          payment_method:
            isGift
              ? "Regalo"
              : paymentMethod,

          payment_status:
            isGift
              ? "Regalo"
              : "Pagato",

          box_quantity:
            selectedPackaging.reduce(
              (sum, item) =>
                sum + item.quantity,
              0
            ),

          box_cost:
            selectedPackaging.reduce(
              (sum, item) =>
                sum +
                item.quantity *
                  item.price,
              0
            ),

          notes:
            notes.trim() || null,
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      /*
       * 2. SALVA ARTICOLI
       *
       * Manteniamo il prezzo originale
       * del prodotto.
       *
       * Lo sconto/regalo è salvato
       * sull'ordine.
       */

      const orderItems =
        selectedItems.map((item) => ({
          order_id: order.id,

          product_id: item.id,

          product_name: item.name,

          variant:
            item.variant || null,

          category: item.category,

          quantity: item.quantity,

          unit_price: item.price,
        }));

      const {
        error: itemsError,
      } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        throw itemsError;
      }

      /*
       * 3. SCALA TUTTO DAL MAGAZZINO
       *
       * Vino
       * Miele
       * Scatole
       *
       * Anche i regali scalano lo stock.
       */

      for (const item of selectedItems) {
        const {
          error: stockError,
        } = await supabase.rpc(
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

    setDiscountPercent(0);
    setIsGift(false);

    setSuccess(false);
    setErrorMessage("");

    loadInventory();
  }

  /*
   * CARD PRODOTTO
   */

  function ProductCard({
    product,
  }: {
    product: Product;
  }) {
    const quantity =
      getQuantity(product.id);

    const price =
      getPrice(product.id);

    const available =
      getAvailable(product.id);

    const remaining =
      Math.max(
        available - quantity,
        0
      );

    const soldOut =
      available === 0;

    return (
      <div className="rounded-[25px] bg-white p-4 shadow-[0_8px_30px_rgba(30,26,21,0.035)]">

        <div className="flex items-center gap-4">

          {/* FOTO */}

          <div
            className={`relative flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-[20px] ${
              product.category === "wine"
                ? "bg-[#F2EEE6]"
                : product.category ===
                  "honey"
                ? "bg-[#F3F0E3]"
                : "bg-[#EEEAE4]"
            }`}
          >
            <Image
              src={
                product.image ||
                "/logo-monteromola.png"
              }
              alt={product.name}
              fill
              className="object-contain p-2"
            />
          </div>

          {/* INFO */}

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

            <p
              className={`mt-2 text-xs font-semibold ${
                soldOut
                  ? "text-red-500"
                  : remaining <= 5
                  ? "text-orange-500"
                  : "text-[#657052]"
              }`}
            >
              {soldOut
                ? "Esaurito"
                : `${available} disponibili`}
            </p>

          </div>

        </div>

        {/* QUANTITÀ */}

        <div className="mt-4 flex items-center justify-between">

          <div>

            <p className="text-[10px] uppercase tracking-widest text-[#969087]">
              Dopo vendita
            </p>

            <p className="mt-1 text-sm font-semibold">
              {remaining} rimasti
            </p>

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
                quantity >= available
              }
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6F2636] text-white disabled:opacity-30"
            >
              <Plus size={18} />
            </button>

          </div>

        </div>

        {quantity > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-[16px] bg-[#F8F5EF] px-4 py-3">

            <span className="text-xs text-[#817B73]">
              Totale
            </span>

            <span className="text-sm font-semibold text-[#6F2636]">
              €
              {(
                price * quantity
              ).toFixed(2)}
            </span>

          </div>
        )}

      </div>
    );
  }

  /*
   * SUCCESSO
   */

  if (success) {
    return (
      <main className="min-h-screen bg-[#FCFAF5] px-5 pb-32 pt-10 text-[#211F1C]">

        <div className="mx-auto max-w-md">

          <div className="flex justify-center">

            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#657052] text-white">

              {isGift ? (
                <Gift size={36} />
              ) : (
                <Check size={38} />
              )}

            </div>

          </div>

          <h1 className="monteromola-serif mt-7 text-center text-[38px] leading-tight">

            {isGift
              ? "Regalo registrato"
              : "Vendita registrata"}

          </h1>

          <p className="mt-3 text-center text-sm text-[#817B73]">

            {isGift
              ? "Il regalo è stato registrato e il magazzino aggiornato."
              : "Vendita e magazzino aggiornati."}

          </p>

          {/* TOTALE */}

          <div className="mt-8 rounded-[28px] bg-[#6F2636] p-6 text-white">

            <p className="text-xs uppercase tracking-[0.18em] text-white/55">

              {isGift
                ? "Valore regalo"
                : "Totale vendita"}

            </p>

            <p className="monteromola-serif mt-2 text-[45px]">

              €
              {saleTotal.toFixed(2)}

            </p>

            {isGift && (
              <p className="mt-2 text-sm text-white/60">
                Valore prodotti: €
                {subtotal.toFixed(2)}
              </p>
            )}

            {!isGift &&
              discountPercent > 0 && (
                <p className="mt-2 text-sm text-white/60">

                  Sconto applicato:{" "}
                  {discountPercent}%

                </p>
              )}

            <p className="mt-2 text-sm text-white/60">

              {selectedQuantity} articoli

            </p>

          </div>

          {/* MAGAZZINO */}

          <div className="mt-5 rounded-[28px] bg-white p-6 shadow-sm">

            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#657052]">
              Magazzino aggiornato
            </p>

            <div className="mt-4 flex items-end justify-between">

              <div>

                <p className="text-sm text-[#8A847D]">
                  Articoli rimanenti
                </p>

                <p className="monteromola-serif mt-1 text-[45px]">
                  {currentWineStock +
                    currentHoneyStock +
                    currentPackagingStock}
                </p>

              </div>

              <ShoppingBag
                size={34}
                className="text-[#6F2636]"
              />

            </div>

            <div className="mt-6 grid grid-cols-3 gap-2">

              <div className="rounded-[18px] bg-[#F7F3ED] p-3">

                <p className="text-[11px] text-[#918B83]">
                  Vino
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {currentWineStock}
                </p>

              </div>

              <div className="rounded-[18px] bg-[#F4F5EE] p-3">

                <p className="text-[11px] text-[#918B83]">
                  Miele
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {currentHoneyStock}
                </p>

              </div>

              <div className="rounded-[18px] bg-[#F3EFEB] p-3">

                <p className="text-[11px] text-[#918B83]">
                  Scatole
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {currentPackagingStock}
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

  /*
   * PAGINA PRINCIPALE
   */

  return (
    <main className="min-h-screen bg-[#FCFAF5] text-[#211F1C]">

      <div className="mx-auto max-w-md px-5 pb-40 pt-6">

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
            Nuova vendita
          </h1>

        </header>

        {/* MAGAZZINO */}

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
                    articoli rimanenti dopo questa vendita
                  </p>

                </div>

                <ShoppingBag
                  size={29}
                  className="text-white/60"
                />

              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">

                <div className="rounded-[18px] bg-white/10 p-3">

                  <p className="text-[11px] text-white/50">
                    Vino
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    {remainingWineStock}
                  </p>

                </div>

                <div className="rounded-[18px] bg-white/10 p-3">

                  <p className="text-[11px] text-white/50">
                    Miele
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    {remainingHoneyStock}
                  </p>

                </div>

                <div className="rounded-[18px] bg-white/10 p-3">

                  <p className="text-[11px] text-white/50">
                    Scatole
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    {remainingPackagingStock}
                  </p>

                </div>

              </div>

            </>
          )}

        </section>

        {/* CLIENTE */}

        <section className="mt-8">

          <label className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8B857D]">
            Cliente
          </label>

          <input
            type="text"
            value={customer}
            onChange={(e) =>
              setCustomer(
                e.target.value
              )
            }
            placeholder="Nome cliente"
            className="mt-2 h-14 w-full rounded-[18px] border border-black/[0.06] bg-white px-4 text-sm outline-none focus:border-[#6F2636]/30"
          />

        </section>

        {/* VINI */}

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
                  product.category ===
                  "wine"
              )
              .map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}

          </div>

        </section>

        {/* MIELE */}

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
                  product.category ===
                  "honey"
              )
              .map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}

          </div>

        </section>

        {/* SCATOLE */}

        <section className="mt-10">

          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C7563]">
            Packaging
          </p>

          <h2 className="monteromola-serif mt-1 text-[29px]">
            Scatole
          </h2>

          <p className="mt-2 text-xs leading-5 text-[#918B83]">
            3 confezioni vino e 2 confezioni miele
          </p>

          <div className="mt-4 space-y-3">

            {products
              .filter(
                (product) =>
                  product.category ===
                  "packaging"
              )
              .map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}

          </div>

        </section>

        {/* SCONTO */}

        <section className="mt-10">

          <div className="flex items-center gap-2 text-[#6F2636]">

            <Percent size={17} />

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em]">
              Condizioni vendita
            </p>

          </div>

          <h2 className="monteromola-serif mt-1 text-[29px]">
            Sconto
          </h2>

          <div className="mt-4 rounded-[26px] bg-white p-5 shadow-[0_8px_30px_rgba(30,26,21,0.04)]">

            <p className="text-xs text-[#817B73]">
              Applica uno sconto sul totale
            </p>

            {/* SCONTI RAPIDI */}

            <div className="mt-4 grid grid-cols-5 gap-2">

              {[0, 5, 10, 15, 20].map(
                (value) => (

                  <button
                    key={value}
                    type="button"
                    disabled={isGift}
                    onClick={() =>
                      setDiscountPercent(
                        value
                      )
                    }
                    className={`rounded-[14px] py-3 text-xs font-semibold transition ${
                      discountPercent ===
                        value &&
                      !isGift
                        ? "bg-[#6F2636] text-white"
                        : "bg-[#F5F1EC] text-[#817B73]"
                    } disabled:opacity-40`}
                  >
                    {value}%
                  </button>

                )
              )}

            </div>

            {/* SCONTO PERSONALIZZATO */}

            <div className="mt-4">

              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#918B83]">
                Oppure inserisci la percentuale
              </p>

              <div className="relative">

                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="100"
                  disabled={isGift}
                  value={discountPercent}
                  onChange={(e) => {
                    const value =
                      Number(
                        e.target.value
                      );

                    setDiscountPercent(
                      Math.min(
                        Math.max(
                          value || 0,
                          0
                        ),
                        100
                      )
                    );
                  }}
                  className="h-14 w-full rounded-[18px] border border-black/[0.06] bg-[#FCFAF5] px-4 pr-12 text-lg font-semibold outline-none focus:border-[#6F2636]/30 disabled:opacity-40"
                />

                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-[#6F2636]">
                  %
                </span>

              </div>

            </div>

          </div>

          {/* REGALO */}

          <button
            type="button"
            onClick={() => {
              const nextGift =
                !isGift;

              setIsGift(nextGift);

              if (nextGift) {
                setDiscountPercent(0);
              }
            }}
            className={`mt-3 flex w-full items-center justify-between rounded-[24px] border p-5 transition ${
              isGift
                ? "border-[#6F2636] bg-[#6F2636] text-white"
                : "border-black/[0.05] bg-white text-[#211F1C]"
            }`}
          >

            <div className="flex items-center gap-4">

              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                  isGift
                    ? "bg-white/10"
                    : "bg-[#F4EEE9]"
                }`}
              >
                <Gift
                  size={20}
                  className={
                    isGift
                      ? "text-white"
                      : "text-[#6F2636]"
                  }
                />
              </div>

              <div className="text-left">

                <p className="text-sm font-semibold">
                  Regalo
                </p>

                <p
                  className={`mt-1 text-xs ${
                    isGift
                      ? "text-white/60"
                      : "text-[#918B83]"
                  }`}
                >
                  Registra la vendita a €0
                </p>

              </div>

            </div>

            {/* SWITCH */}

            <div
              className={`ml-3 flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${
                isGift
                  ? "justify-end bg-white/20"
                  : "justify-start bg-[#E8E3DC]"
              }`}
            >
              <div className="h-5 w-5 rounded-full bg-white shadow-sm" />
            </div>

          </button>

          {isGift && (
            <div className="mt-3 rounded-[18px] bg-[#F4EEE9] px-4 py-3">

              <p className="text-xs leading-5 text-[#6F2636]">
                I prodotti verranno scalati normalmente dal magazzino, ma l'incasso della vendita sarà €0.
              </p>

            </div>
          )}

        </section>

        {/* PAGAMENTO */}

        {!isGift && (
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
                    setPaymentMethod(
                      method
                    )
                  }
                  className={`rounded-[17px] border px-4 py-3 text-sm font-semibold ${
                    paymentMethod ===
                    method
                      ? "border-[#6F2636] bg-[#6F2636] text-white"
                      : "border-black/[0.06] bg-white text-[#514C46]"
                  }`}
                >
                  {method}
                </button>

              ))}

            </div>

          </section>
        )}

        {/* NOTE */}

        <section className="mt-8">

          <label className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8B857D]">
            Note
          </label>

          <textarea
            value={notes}
            onChange={(e) =>
              setNotes(
                e.target.value
              )
            }
            placeholder="Note opzionali..."
            rows={3}
            className="mt-2 w-full resize-none rounded-[18px] border border-black/[0.06] bg-white p-4 text-sm outline-none focus:border-[#6F2636]/30"
          />

        </section>

        {/* ERRORI */}

        {errorMessage && (
          <div className="mt-6 rounded-[18px] bg-red-50 p-4 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        {/* RIEPILOGO */}

        <section className="mt-8 overflow-hidden rounded-[28px] bg-[#5F2030] p-5 text-white shadow-[0_18px_45px_rgba(95,32,48,0.15)]">

          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
            Riepilogo
          </p>

          <div className="mt-4 flex justify-between text-sm">

            <span className="text-white/50">
              Articoli
            </span>

            <span className="font-semibold">
              {selectedQuantity}
            </span>

          </div>

          <div className="mt-3 flex justify-between text-sm">

            <span className="text-white/50">
              Subtotale
            </span>

            <span className="font-semibold">
              €{subtotal.toFixed(2)}
            </span>

          </div>

          {!isGift &&
            discountPercent > 0 && (
              <div className="mt-3 flex justify-between text-sm">

                <span className="text-[#E8D6C7]">
                  Sconto{" "}
                  {discountPercent}%
                </span>

                <span className="font-semibold text-[#E8D6C7]">
                  −€
                  {discountAmount.toFixed(
                    2
                  )}
                </span>

              </div>
            )}

          {isGift && (
            <div className="mt-3 flex justify-between text-sm">

              <span className="font-semibold text-[#E8D6C7]">
                🎁 Regalo
              </span>

              <span className="font-semibold text-[#E8D6C7]">
                −€
                {subtotal.toFixed(2)}
              </span>

            </div>
          )}

          <div className="mt-3 flex justify-between text-sm">

            <span className="text-white/50">
              Rimanenza magazzino
            </span>

            <span className="font-semibold">
              {totalRemaining}
            </span>

          </div>

          <div className="mt-5 border-t border-white/10 pt-5">

            <div className="flex items-end justify-between">

              <span className="text-sm font-semibold text-white/70">

                {isGift
                  ? "Totale regalo"
                  : "Totale da pagare"}

              </span>

              <span className="monteromola-serif text-[40px] leading-none">

                €
                {saleTotal.toFixed(2)}

              </span>

            </div>

          </div>

        </section>

        {/* REGISTRA */}

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
            : isGift
            ? "Registra regalo · €0.00"
            : `Registra vendita · €${saleTotal.toFixed(
                2
              )}`}

        </button>

      </div>

      <BottomNav />

    </main>
  );
}