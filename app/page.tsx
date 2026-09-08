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
      background: "bg-[#EEE5DA]",
    },
    {
      name: "Gea",
      price: 12,
      image: "/gea.png",
      background: "bg-[#E7E9DE]",
    },
    {
      name: "Giulio",
      price: 18,
      image: "/giulio.png",
      background: "bg-[#EEE2E0]",
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
        <header className="px-5 pt-7">
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
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#6F2636]">
                  Tenuta
                </p>

                <p className="monteromola-serif text-[23px] leading-none">
                  Monteromola
                </p>
              </div>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xs font-semibold shadow-sm">
              EC
            </div>
          </div>

          <h1 className="monteromola-serif mt-8 text-[42px] leading-[0.93] tracking-[-0.03em]">
            Buongiorno,
            <br />
            Elena.
          </h1>

          <p className="mt-4 max-w-[285px] text-sm leading-6 text-[#817B73]">
            La tua Tenuta, le vendite e i prodotti.
            Tutto in un unico posto.
          </p>
        </header>

        {/* HERO */}
        <section className="relative mx-5 mt-7 min-h-[315px] overflow-hidden rounded-[36px] bg-[#651F31] text-white shadow-[0_24px_60px_rgba(91,28,42,0.2)]">

          {/* BACKGROUND UVA */}
          <div className="absolute inset-0">
            <Image
              src="/uva1.png"
              alt="Uva Monteromola"
              fill
              priority
              className="object-cover opacity-35"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-[#541727]/95 via-[#641F31]/75 to-[#641F31]/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#4E1423]/55 via-transparent to-transparent" />
          </div>

          <div className="relative z-10 p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
              Questo mese
            </p>

            <p className="monteromola-serif mt-3 text-[54px] leading-none tracking-[-0.04em]">
              €{revenue.toFixed(0)}
            </p>

            <p className="mt-2 text-sm text-white/65">
              vendite registrate
            </p>

            <div className="mt-9 flex gap-8">
              <div>
                <p className="text-2xl font-semibold">
                  {ordersCount}
                </p>

                <p className="mt-1 text-xs text-white/50">
                  ordini
                </p>
              </div>

              <div>
                <p className="text-2xl font-semibold">
                  {productsSold}
                </p>

                <p className="mt-1 text-xs text-white/50">
                  prodotti
                </p>
              </div>
            </div>
          </div>

          {/* BOTTIGLIA */}
          <div className="absolute -bottom-14 right-0 h-[300px] w-[140px] rotate-[5deg]">
            <Image
              src="/onelia.png"
              alt="Onelia"
              fill
              className="object-contain drop-shadow-[0_24px_20px_rgba(0,0,0,0.28)]"
            />
          </div>
        </section>

        {/* MAIN ACTION */}
        <div className="px-5">
          <Link
            href="/sales/new"
            className="mt-5 flex w-full items-center justify-between rounded-[24px] bg-[#211F1C] px-5 py-[18px] text-white shadow-[0_10px_30px_rgba(20,18,16,0.12)]"
          >
            <div>
              <p className="font-semibold">
                Registra una vendita
              </p>

              <p className="mt-0.5 text-[11px] text-white/50">
                Vino, miele e pagamento
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
              <ArrowUpRight size={18} />
            </div>
          </Link>
        </div>

        {/* RECENT SALES */}
        <section className="mt-12">
          <div className="flex items-end justify-between px-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9D968D]">
                Attività
              </p>

              <h2 className="monteromola-serif mt-1 text-[30px]">
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

          <div className="mx-5 mt-4 overflow-hidden rounded-[29px] bg-white shadow-[0_8px_30px_rgba(30,26,21,0.04)]">
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

                  <p className="monteromola-serif text-[22px]">
                    €{Number(order.total).toFixed(0)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* EDITORIAL UVA */}
        <section className="mx-5 mt-12 overflow-hidden rounded-[32px] bg-[#EDE5DA]">
          <div className="relative h-[230px]">
            <Image
              src="/uva2.png"
              alt="Vigneto Monteromola"
              fill
              className="object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

            <div className="absolute bottom-0 left-0 p-6 text-white">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/65">
                La Tenuta
              </p>

              <p className="monteromola-serif mt-1 max-w-[250px] text-[31px] leading-[0.95]">
                Dalla vigna
                <br />
                alla bottiglia.
              </p>
            </div>
          </div>
        </section>

        {/* WINES */}
        <section className="mt-12">
          <div className="px-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6F2636]">
              La cantina
            </p>

            <h2 className="monteromola-serif mt-1 text-[32px]">
              I nostri vini
            </h2>
          </div>

          <div className="hide-scrollbar mt-5 flex snap-x gap-4 overflow-x-auto px-5 pb-4">
            {wines.map((wine) => (
              <div
                key={wine.name}
                className={`relative min-w-[215px] snap-center overflow-hidden rounded-[31px] p-5 ${wine.background}`}
              >
                <div className="relative mx-auto h-[235px] w-[105px]">
                  <Image
                    src={wine.image}
                    alt={wine.name}
                    fill
                    className="object-contain drop-shadow-xl"
                  />
                </div>

                <p className="monteromola-serif mt-1 text-[27px]">
                  {wine.name}
                </p>

                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-[#837D75]">
                    Monteromola
                  </p>

                  <p className="text-sm font-semibold">
                    €{wine.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* HONEY HERO */}
        <section className="mx-5 mt-12 overflow-hidden rounded-[34px] bg-[#EEE8D5]">
          <div className="relative h-[220px]">
            <Image
              src="/miele.png"
              alt="Miele Monteromola"
              fill
              className="object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-[#403A26]/75 via-[#403A26]/25 to-transparent" />

            <div className="absolute left-0 top-0 p-6 text-white">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
                Dalla Tenuta
              </p>

              <h2 className="monteromola-serif mt-2 text-[34px] leading-[0.95]">
                Il nostro
                <br />
                miele.
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4">
            {honey.map((item) => (
              <div
                key={item.name}
                className="rounded-[22px] bg-white/85 p-3 backdrop-blur"
              >
                <div className="relative aspect-square rounded-[17px] bg-[#F5F0E3]">
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

                <p className="mt-1 text-[11px] text-[#747A5E]">
                  da €{item.price}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* STOCK */}
        <section className="mx-5 mt-10">
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
        </section>

        {/* FOOTER */}
        <footer className="pb-8 pt-14 text-center">
          <div className="relative mx-auto h-12 w-12 opacity-35">
            <Image
              src="/logo-monteromola.png"
              alt="Monteromola"
              fill
              className="object-contain"
            />
          </div>

          <p className="monteromola-serif mt-3 text-lg text-[#A39D94]">
            Monteromola
          </p>
        </footer>

      </div>

      <BottomNav />
    </main>
  );
}