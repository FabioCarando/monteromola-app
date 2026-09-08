import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronRight,
  Package,
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
  customer?: string | null;
  payment_method?: string | null;
  order_items: OrderItem[];
};

async function getDashboardData() {
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

  const { data, error } = await supabase
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
    .order("order_date", { ascending: false });

  if (error) {
    console.error("Errore dashboard:", error);

    return {
      revenue: 0,
      ordersCount: 0,
      productsSold: 0,
      recentOrders: [] as Order[],
    };
  }

  const orders = (data || []) as Order[];

  const revenue = orders.reduce(
    (sum, order) => sum + Number(order.total),
    0
  );

  const productsSold = orders.reduce((sum, order) => {
    return (
      sum +
      order.order_items.reduce(
        (itemSum, item) => itemSum + item.quantity,
        0
      )
    );
  }, 0);

  return {
    revenue,
    ordersCount: orders.length,
    productsSold,
    recentOrders: orders.slice(0, 3),
  };
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

export default async function Home() {
  const {
    revenue,
    ordersCount,
    productsSold,
    recentOrders,
  } = await getDashboardData();

  const wines = [
    {
      name: "Onelia",
      price: 15,
      image: "/onelia.png",
    },
    {
      name: "Gea",
      price: 12,
      image: "/gea.png",
    },
    {
      name: "Giulio",
      price: 18,
      image: "/giulio.png",
    },
  ];

  const honey = [
    {
      name: "Acacia",
      price: 6,
      image: "/acacia.png",
    },
    {
      name: "Millefiori",
      price: 6,
      image: "/millefiori.png",
    },
    {
      name: "Melata",
      price: 7,
      image: "/melata.png",
    },
  ];

  return (
    <main className="min-h-screen bg-[#FCFAF5] text-[#211F1C]">
      <div className="mx-auto max-w-md pb-32">

        {/* HEADER */}
        <header className="px-5 pb-2 pt-7">
          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14">
                <Image
                  src="/logo-monteromola.png"
                  alt="Tenuta Monteromola"
                  fill
                  priority
                  className="object-contain"
                />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.23em] text-[#6F2636]">
                  Tenuta
                </p>

                <p className="monteromola-serif text-[22px] leading-none">
                  Monteromola
                </p>
              </div>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xs font-semibold shadow-sm">
              EC
            </div>

          </div>

          <h1 className="monteromola-serif mt-8 text-[39px] leading-[0.95] tracking-[-0.025em]">
            Buongiorno,
            <br />
            Elena.
          </h1>

          <p className="mt-4 max-w-[280px] text-sm leading-6 text-[#817B73]">
            Una panoramica della Tenuta, delle vendite
            e dei tuoi prodotti.
          </p>
        </header>

        {/* HERO */}
        <section className="relative mx-5 mt-7 min-h-[280px] overflow-hidden rounded-[34px] bg-[#641F30] px-6 py-6 text-white shadow-[0_20px_50px_rgba(91,28,42,0.18)]">

          <div className="relative z-10">
            <p className="text-xs font-medium uppercase tracking-[0.17em] text-white/55">
              Settembre
            </p>

            <p className="monteromola-serif mt-3 text-[49px] leading-none tracking-[-0.035em]">
              €{revenue.toFixed(0)}
            </p>

            <p className="mt-2 text-sm text-white/60">
              vendite questo mese
            </p>

            <div className="mt-8 flex gap-7">
              <div>
                <p className="text-xl font-semibold">
                  {ordersCount}
                </p>
                <p className="text-xs text-white/50">
                  ordini
                </p>
              </div>

              <div>
                <p className="text-xl font-semibold">
                  {productsSold}
                </p>
                <p className="text-xs text-white/50">
                  prodotti
                </p>
              </div>
            </div>
          </div>

          {/* BOTTIGLIA HERO */}
          <div className="absolute -bottom-12 -right-1 h-[290px] w-[135px] rotate-[5deg]">
            <Image
              src="/onelia.png"
              alt="Onelia"
              fill
              priority
              className="object-contain drop-shadow-2xl"
            />
          </div>

          <div className="absolute right-10 top-5 h-28 w-28 rounded-full bg-white/5 blur-2xl" />
        </section>

        {/* MAIN ACTION */}
        <div className="px-5">
          <Link
            href="/sales/new"
            className="mt-5 flex w-full items-center justify-between rounded-[23px] bg-[#211F1C] px-5 py-[17px] text-white shadow-sm"
          >
            <span className="font-semibold">
              Registra una vendita
            </span>

            <ArrowUpRight size={20} />
          </Link>
        </div>

        {/* RECENT SALES */}
        <section className="mt-11">
          <div className="flex items-end justify-between px-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9D968D]">
                Attività
              </p>

              <h2 className="monteromola-serif mt-1 text-[29px]">
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

          <div className="mx-5 mt-4 overflow-hidden rounded-[28px] bg-white shadow-[0_8px_30px_rgba(30,26,21,0.035)]">

            {recentOrders.length === 0 ? (
              <div className="p-6 text-sm text-[#8C867D]">
                Nessuna vendita registrata.
              </div>
            ) : (
              recentOrders.map((order, index) => (
                <div
                  key={order.id}
                  className={`flex items-center justify-between p-5 ${
                    index !== recentOrders.length - 1
                      ? "border-b border-black/[0.045]"
                      : ""
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {order.customer || "Vendita diretta"}
                    </p>

                    <p className="mt-1 text-xs text-[#9A948C]">
                      {formatShortDate(order.order_date)}
                      {order.payment_method
                        ? ` · ${order.payment_method}`
                        : ""}
                    </p>
                  </div>

                  <p className="monteromola-serif text-[21px]">
                    €{Number(order.total).toFixed(0)}
                  </p>
                </div>
              ))
            )}

          </div>
        </section>

        {/* WINE COLLECTION */}
        <section className="mt-12">
          <div className="px-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6F2636]">
              La cantina
            </p>

            <h2 className="monteromola-serif mt-1 text-[31px]">
              I nostri vini
            </h2>
          </div>

          <div className="hide-scrollbar mt-5 flex snap-x gap-4 overflow-x-auto px-5 pb-4">

            {wines.map((wine, index) => (
              <div
                key={wine.name}
                className={`relative min-w-[215px] snap-center overflow-hidden rounded-[30px] p-5 ${
                  index === 0
                    ? "bg-[#EDE5DA]"
                    : index === 1
                      ? "bg-[#E8E9DF]"
                      : "bg-[#EEE4E1]"
                }`}
              >
                <div className="relative mx-auto h-[235px] w-[100px]">
                  <Image
                    src={wine.image}
                    alt={wine.name}
                    fill
                    className="object-contain drop-shadow-xl"
                  />
                </div>

                <p className="monteromola-serif mt-1 text-[26px]">
                  {wine.name}
                </p>

                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-[#837D75]">
                    Tenuta Monteromola
                  </p>

                  <p className="text-sm font-semibold">
                    €{wine.price}
                  </p>
                </div>
              </div>
            ))}

          </div>
        </section>

        {/* HONEY */}
        <section className="mt-10 px-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#667052]">
            Dalla Tenuta
          </p>

          <h2 className="monteromola-serif mt-1 text-[31px]">
            Il nostro miele
          </h2>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {honey.map((item) => (
              <div
                key={item.name}
                className="rounded-[25px] bg-white p-3 shadow-[0_7px_25px_rgba(30,26,21,0.035)]"
              >
                <div className="relative aspect-square rounded-[19px] bg-[#F1EDDF]">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-contain p-2"
                  />
                </div>

                <p className="mt-3 text-xs font-semibold">
                  {item.name}
                </p>

                <p className="mt-1 text-[11px] text-[#7B8467]">
                  da €{item.price}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* STOCK SHORTCUT */}
        <section className="mx-5 mt-10">
          <Link
            href="/inventory"
            className="flex items-center justify-between rounded-[26px] bg-[#ECE8DF] p-5"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white">
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
                  Controlla disponibilità e stock
                </p>
              </div>
            </div>

            <ChevronRight
              size={18}
              className="text-[#908A82]"
            />
          </Link>
        </section>

        <footer className="pb-8 pt-14 text-center">
          <div className="relative mx-auto h-11 w-11 opacity-35">
            <Image
              src="/logo-monteromola.png"
              alt="Monteromola"
              fill
              className="object-contain"
            />
          </div>
        </footer>

      </div>

      <BottomNav />
    </main>
  );
}