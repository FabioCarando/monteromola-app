import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Euro,
  Package,
  Plus,
  ReceiptText,
  ShoppingBag,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type OrderItem = {
  quantity: number;
};

type Order = {
  id: number;
  total: number;
  order_date: string;
  customer: string | null;
  payment_method: string | null;
  order_items: OrderItem[];
};

type InventoryItem = {
  product_id: string;
  product_name: string;
  variant: string | null;
  category: string;
  quantity: number;
  price: number;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

function formatPrice(value: number) {
  return Number(value || 0).toFixed(2);
}

export default async function HomePage() {
  /*
   * DATE
   */

  const now = new Date();

  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString();

  const startOfNextMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1
  ).toISOString();

  const startOfPreviousMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  ).toISOString();

  /*
   * ORDINI MESE CORRENTE
   */

  const { data: currentMonthData, error: currentMonthError } =
    await supabase
      .from("orders")
      .select(`
        id,
        total,
        order_date,
        customer,
        payment_method,
        order_items (
          quantity
        )
      `)
      .gte("order_date", startOfMonth)
      .lt("order_date", startOfNextMonth)
      .order("order_date", {
        ascending: false,
      });

  if (currentMonthError) {
    console.error(
      "Errore caricamento vendite:",
      currentMonthError
    );
  }

  const orders = (currentMonthData || []) as Order[];

  /*
   * ORDINI MESE PRECEDENTE
   */

  const { data: previousMonthData } = await supabase
    .from("orders")
    .select("total")
    .gte("order_date", startOfPreviousMonth)
    .lt("order_date", startOfMonth);

  /*
   * INVENTORY + PREZZI
   */

  const { data: inventoryData, error: inventoryError } =
    await supabase
      .from("inventory")
      .select(`
        product_id,
        product_name,
        variant,
        category,
        quantity,
        price
      `);

  if (inventoryError) {
    console.error(
      "Errore caricamento inventory:",
      inventoryError
    );
  }

  const inventory = (inventoryData || []) as InventoryItem[];

  /*
   * FUNZIONI PREZZI
   */

  function getPrice(productId: string) {
    const item = inventory.find(
      (product) => product.product_id === productId
    );

    return Number(item?.price || 0);
  }

  /*
   * KPI VENDITE
   */

  const monthRevenue = orders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const monthOrders = orders.length;

  const averageOrder =
    monthOrders > 0
      ? monthRevenue / monthOrders
      : 0;

  const previousMonthRevenue = (
    previousMonthData || []
  ).reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const revenueChange =
    previousMonthRevenue > 0
      ? ((monthRevenue - previousMonthRevenue) /
          previousMonthRevenue) *
        100
      : null;

  /*
   * ULTIME VENDITE
   */

  const latestOrders = orders.slice(0, 3);

  /*
   * PRODOTTI HOME
   */

  const wines = [
    {
      id: "onelia",
      name: "Onelia",
      image: "/onelia.png",
    },
    {
      id: "gea",
      name: "Gea",
      image: "/gea.png",
    },
    {
      id: "giulio",
      name: "Giulio",
      image: "/giulio.png",
    },
  ];

  const honey = [
    {
      id: "acacia-250",
      name: "Acacia",
      variant: "250g",
      image: "/acacia.png",
    },
    {
      id: "millefiori-250",
      name: "Millefiori",
      variant: "250g",
      image: "/millefiori.png",
    },
    {
      id: "melata-250",
      name: "Melata",
      variant: "250g",
      image: "/melata.png",
    },
  ];

  return (
    <main className="min-h-screen bg-[#FCFAF5] pb-32 text-[#211F1C]">

      {/* HEADER */}

      <header className="mx-auto max-w-md px-5 pt-6">

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="relative h-12 w-12">
              <Image
                src="/logo-monteromola.png"
                alt="Tenuta Monteromola"
                fill
                priority
                className="object-contain"
              />
            </div>

            <div>

              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#6F2636]">
                Tenuta Monteromola
              </p>

              <h1 className="monteromola-serif mt-0.5 text-[24px] leading-none">
                Buongiorno, Elena
              </h1>

            </div>

          </div>

        </div>

      </header>

      {/* HERO */}

      <section className="mx-5 mt-7">

        <div className="relative min-h-[375px] overflow-hidden rounded-[34px] bg-[#6F2636] shadow-[0_20px_50px_rgba(91,28,42,0.14)]">

          <Image
            src="/uva1.png"
            alt="Tenuta Monteromola"
            fill
            priority
            className="object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col justify-between p-6">

            <div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">
                La Tenuta
              </p>

              <h2 className="monteromola-serif mt-3 max-w-[260px] text-[38px] leading-[0.98] text-white">
                Gesti antichi,
                <br />
                sapori veri.
              </h2>

              <p className="mt-4 max-w-[230px] text-sm leading-6 text-white/65">
                Vino e miele dalla nostra Tenuta.
              </p>

            </div>

            <Link
              href="/sales/new"
              className="flex w-fit items-center gap-3 rounded-full bg-white px-5 py-3.5 text-sm font-semibold text-[#6F2636]"
            >
              <Plus
                size={17}
                strokeWidth={2}
              />

              Registra una vendita
            </Link>

          </div>

          <div className="absolute bottom-0 right-[-30px] h-[255px] w-[145px] opacity-95">

            <Image
              src="/onelia.png"
              alt="Onelia"
              fill
              className="object-contain"
            />

          </div>

        </div>

      </section>

      {/* PERFORMANCE VENDITE */}

      <section className="mx-5 mt-9">

        <div className="flex items-end justify-between">

          <div>

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6F2636]">
              Questo mese
            </p>

            <h2 className="monteromola-serif mt-1 text-[28px]">
              Come vanno le vendite
            </h2>

          </div>

        </div>

        <div className="mt-4 rounded-[28px] bg-white p-5 shadow-[0_8px_30px_rgba(30,26,21,0.04)]">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs text-[#918B83]">
                Fatturato
              </p>

              <p className="monteromola-serif mt-1 text-[38px] leading-none text-[#211F1C]">
                €{monthRevenue.toFixed(0)}
              </p>

            </div>

            {revenueChange !== null && (
              <div
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  revenueChange >= 0
                    ? "bg-[#EEF1E7] text-[#657052]"
                    : "bg-[#F7E9E9] text-[#9B4545]"
                }`}
              >
                {revenueChange >= 0 ? "+" : ""}
                {revenueChange.toFixed(0)}%
              </div>
            )}

          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">

            <div className="rounded-[19px] bg-[#F8F5EF] p-4">

              <p className="text-xs text-[#918B83]">
                Vendite
              </p>

              <p className="mt-1 text-xl font-semibold">
                {monthOrders}
              </p>

            </div>

            <div className="rounded-[19px] bg-[#F8F5EF] p-4">

              <p className="text-xs text-[#918B83]">
                Media vendita
              </p>

              <p className="mt-1 text-xl font-semibold">
                €{averageOrder.toFixed(0)}
              </p>

            </div>

          </div>

          <p className="mt-4 text-[11px] text-[#A09A92]">
            Confronto del fatturato con il mese precedente
          </p>

        </div>

      </section>

      {/* ULTIME VENDITE */}

      <section className="mx-5 mt-10">

        <div className="flex items-end justify-between">

          <div>

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6F2636]">
              Attività
            </p>

            <h2 className="monteromola-serif mt-1 text-[28px]">
              Ultime vendite
            </h2>

          </div>

          <Link
            href="/orders"
            className="flex items-center gap-1 text-xs font-semibold text-[#6F2636]"
          >
            Vedi tutte

            <ChevronRight size={14} />
          </Link>

        </div>

        {latestOrders.length > 0 ? (
          <div className="mt-4 space-y-3">

            {latestOrders.map((order) => {

              const itemCount = (
                order.order_items || []
              ).reduce(
                (sum, item) =>
                  sum + Number(item.quantity || 0),
                0
              );

              return (
                <Link
                  href="/orders"
                  key={order.id}
                  className="flex items-center justify-between rounded-[24px] bg-white p-4 shadow-[0_8px_30px_rgba(30,26,21,0.035)]"
                >

                  <div className="flex items-center gap-4">

                    <div className="flex h-12 w-12 items-center justify-center rounded-[17px] bg-[#F2ECE5] text-[#6F2636]">
                      <ReceiptText
                        size={19}
                        strokeWidth={1.7}
                      />
                    </div>

                    <div>

                      <p className="text-sm font-semibold">
                        {order.customer ||
                          "Vendita diretta"}
                      </p>

                      <p className="mt-1 text-xs text-[#918B83]">
                        {formatDate(
                          order.order_date
                        )}

                        {itemCount > 0 &&
                          ` · ${itemCount} ${
                            itemCount === 1
                              ? "articolo"
                              : "articoli"
                          }`}
                      </p>

                    </div>

                  </div>

                  <div className="text-right">

                    <p className="text-sm font-semibold text-[#6F2636]">
                      €
                      {Number(
                        order.total || 0
                      ).toFixed(2)}
                    </p>

                    {order.payment_method && (
                      <p className="mt-1 text-[10px] text-[#A09A92]">
                        {order.payment_method}
                      </p>
                    )}

                  </div>

                </Link>
              );
            })}

          </div>
        ) : (
          <div className="mt-4 rounded-[24px] bg-white p-6 text-center shadow-sm">

            <ShoppingBag
              size={24}
              strokeWidth={1.5}
              className="mx-auto text-[#6F2636]"
            />

            <p className="mt-3 text-sm font-semibold">
              Nessuna vendita questo mese
            </p>

            <p className="mt-1 text-xs text-[#918B83]">
              Le nuove vendite compariranno qui.
            </p>

          </div>
        )}

      </section>

      {/* VIGNA */}

      <section className="mx-5 mt-10">

        <div className="relative min-h-[260px] overflow-hidden rounded-[32px]">

          <Image
            src="/uva2.png"
            alt="Vigna Tenuta Monteromola"
            fill
            className="object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6">

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
              Tenuta Monteromola
            </p>

            <h2 className="monteromola-serif mt-2 max-w-[290px] text-[31px] leading-[1.05] text-white">
              Dalla vigna
              <br />
              alla bottiglia.
            </h2>

          </div>

        </div>

      </section>

      {/* VINI */}

      <section className="mt-11">

        <div className="mx-5">

          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6F2636]">
            La Cantina
          </p>

          <h2 className="monteromola-serif mt-1 text-[30px]">
            I nostri vini
          </h2>

        </div>

        <div className="hide-scrollbar mt-5 flex gap-3 overflow-x-auto px-5 pb-2">

          {wines.map((wine) => (
            <div
              key={wine.id}
              className="w-[145px] shrink-0 overflow-hidden rounded-[25px] bg-white shadow-[0_8px_25px_rgba(30,26,21,0.035)]"
            >

              <div className="relative h-[190px] bg-[#F2ECE5]">

                <Image
                  src={wine.image}
                  alt={wine.name}
                  fill
                  className="object-contain p-3"
                />

              </div>

              <div className="p-4">

                <p className="monteromola-serif text-[20px]">
                  {wine.name}
                </p>

                <p className="mt-2 text-xs font-semibold text-[#6F2636]">
                  €{formatPrice(
                    getPrice(wine.id)
                  )}
                </p>

              </div>

            </div>
          ))}

        </div>

      </section>

      {/* MIELE HERO */}

      <section className="mx-5 mt-11">

        <div className="relative min-h-[265px] overflow-hidden rounded-[32px] bg-[#657052]">

          <Image
            src="/miele.png"
            alt="Miele Tenuta Monteromola"
            fill
            className="object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />

          <div className="absolute inset-0 flex flex-col justify-end p-6">

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/65">
              Dalla Tenuta
            </p>

            <h2 className="monteromola-serif mt-2 text-[32px] leading-none text-white">
              Il nostro miele
            </h2>

            <p className="mt-3 max-w-[240px] text-sm leading-5 text-white/65">
              Acacia, Millefiori e Melata.
            </p>

          </div>

        </div>

      </section>

      {/* MIELI */}

      <section className="mt-5">

        <div className="hide-scrollbar flex gap-3 overflow-x-auto px-5 pb-2">

          {honey.map((item) => (
            <div
              key={item.id}
              className="w-[145px] shrink-0 overflow-hidden rounded-[25px] bg-white shadow-[0_8px_25px_rgba(30,26,21,0.035)]"
            >

              <div className="relative h-[145px] bg-[#F1F0E6]">

                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-contain p-3"
                />

              </div>

              <div className="p-4">

                <p className="text-sm font-semibold">
                  {item.name}
                </p>

                <div className="mt-1 flex items-center justify-between">

                  <p className="text-[11px] text-[#918B83]">
                    {item.variant}
                  </p>

                  <p className="text-xs font-semibold text-[#657052]">
                    €{formatPrice(
                      getPrice(item.id)
                    )}
                  </p>

                </div>

              </div>

            </div>
          ))}

        </div>

      </section>

      {/* GESTIONE */}

      <section className="mx-5 mt-10 space-y-3">

        {/* MAGAZZINO */}

        <Link
          href="/inventory"
          className="flex items-center justify-between rounded-[27px] bg-[#ECE8DF] p-5"
        >

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-[17px] bg-white">

              <Package
                size={20}
                strokeWidth={1.7}
                className="text-[#6F2636]"
              />

            </div>

            <div>

              <p className="text-sm font-semibold">
                Magazzino
              </p>

              <p className="mt-1 text-xs text-[#8A847C]">
                Disponibilità e stock
              </p>

            </div>

          </div>

          <ChevronRight
            size={18}
            className="text-[#908A82]"
          />

        </Link>

        {/* PREZZI */}

        <Link
          href="/prices"
          className="flex items-center justify-between rounded-[27px] bg-[#ECE8DF] p-5"
        >

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-[17px] bg-white">

              <Euro
                size={20}
                strokeWidth={1.7}
                className="text-[#6F2636]"
              />

            </div>

            <div>

              <p className="text-sm font-semibold">
                Prezzi
              </p>

              <p className="mt-1 text-xs text-[#8A847C]">
                Gestisci il listino prodotti
              </p>

            </div>

          </div>

          <ChevronRight
            size={18}
            className="text-[#908A82]"
          />

        </Link>

      </section>

      {/* CTA FINALE */}

      <section className="mx-5 mt-10">

        <Link
          href="/sales/new"
          className="flex min-h-[62px] w-full items-center justify-between rounded-[24px] bg-[#6F2636] px-5 text-white shadow-[0_12px_35px_rgba(111,38,54,0.2)]"
        >

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">

              <Plus
                size={20}
                strokeWidth={2}
              />

            </div>

            <div>

              <p className="text-sm font-semibold">
                Nuova vendita
              </p>

              <p className="mt-0.5 text-[11px] text-white/55">
                Registra vino, miele e scatole
              </p>

            </div>

          </div>

          <ArrowRight size={19} />

        </Link>

      </section>

      <BottomNav />

    </main>
  );
}