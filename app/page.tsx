import Image from "next/image";
import Link from "next/link";
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
      order_items (
        quantity
      )
    `)
    .gte("order_date", startOfMonth)
    .lt("order_date", startOfNextMonth);

  if (error) {
    console.error("Errore dashboard:", error);

    return {
      revenue: 0,
      ordersCount: 0,
      productsSold: 0,
    };
  }

  const orders = (data || []) as Order[];

  const revenue = orders.reduce(
    (sum, order) => sum + Number(order.total),
    0
  );

  const ordersCount = orders.length;

  const productsSold = orders.reduce((sum, order) => {
    const orderQuantity = order.order_items.reduce(
      (itemSum, item) => itemSum + item.quantity,
      0
    );

    return sum + orderQuantity;
  }, 0);

  return {
    revenue,
    ordersCount,
    productsSold,
  };
}

export default async function Home() {
  const {
    revenue,
    ordersCount,
    productsSold,
  } = await getDashboardData();

  const wines = [
    {
      name: "Onelia",
      price: 15,
      stock: 0,
      image: "/onelia.png",
    },
    {
      name: "Gea",
      price: 12,
      stock: 0,
      image: "/gea.png",
    },
    {
      name: "Giulio",
      price: 18,
      stock: 0,
      image: "/giulio.png",
    },
  ];

  const honey = [
    {
      name: "Acacia",
      size: "250g",
      price: 6,
      stock: 0,
      image: "/acacia.png",
    },
    {
      name: "Acacia",
      size: "500g",
      price: 11,
      stock: 0,
      image: "/acacia.png",
    },
    {
      name: "Millefiori",
      size: "250g",
      price: 6,
      stock: 0,
      image: "/millefiori.png",
    },
    {
      name: "Millefiori",
      size: "500g",
      price: 11,
      stock: 0,
      image: "/millefiori.png",
    },
    {
      name: "Melata",
      size: "250g",
      price: 7,
      stock: 0,
      image: "/melata.png",
    },
    {
      name: "Melata",
      size: "500g",
      price: 11,
      stock: 0,
      image: "/melata.png",
    },
  ];

  const honeyProducts = [
    {
      name: "Acacia",
      image: "/acacia.png",
      fromPrice: 6,
    },
    {
      name: "Millefiori",
      image: "/millefiori.png",
      fromPrice: 6,
    },
    {
      name: "Melata",
      image: "/melata.png",
      fromPrice: 7,
    },
  ];

  return (
    <main className="min-h-screen bg-[#F7F3EA] text-[#27231F]">
      <div className="mx-auto max-w-md px-5 pb-32 pt-7">

        {/* HEADER */}
        <header>
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[22px] bg-white shadow-sm">
              <Image
                src="/logo-monteromola.png"
                alt="Tenuta Monteromola"
                fill
                priority
                className="object-contain p-2"
              />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#722F37]">
                Tenuta Monteromola
              </p>

              <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                Buongiorno, Elena
              </h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-neutral-500">
            Vendite, ordini e magazzino in un unico posto.
          </p>
        </header>

        {/* DASHBOARD */}
        <section className="mt-7 overflow-hidden rounded-[32px] bg-[#722F37] p-6 text-white shadow-lg">
          <p className="text-sm text-white/70">
            Vendite questo mese
          </p>

          <p className="mt-2 text-4xl font-semibold tracking-tight">
            €{revenue.toFixed(2)}
          </p>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs text-white/60">
                Ordini
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {ordersCount}
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs text-white/60">
                Prodotti venduti
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {productsSold}
              </p>
            </div>
          </div>
        </section>

        {/* NUOVA VENDITA */}
        <Link
          href="/sales/new"
          className="mt-5 flex w-full items-center justify-center rounded-[22px] bg-[#27231F] px-5 py-4 text-base font-semibold text-white shadow-sm transition active:scale-[0.98]"
        >
          + Registra una vendita
        </Link>

        {/* STORICO */}
        <Link
          href="/orders"
          className="mt-3 flex w-full items-center justify-between rounded-[22px] bg-white px-5 py-4 font-medium shadow-sm transition active:scale-[0.98]"
        >
          <span>Storico vendite</span>

          <span className="text-xl text-neutral-400">
            →
          </span>
        </Link>

        {/* PRODOTTI */}
        <section className="mt-10">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#722F37]">
            Tenuta Monteromola
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            I nostri prodotti
          </h2>

          {/* VINI */}
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">
                Vini
              </h3>

              <span className="text-xs text-neutral-400">
                3 etichette
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {wines.map((wine) => (
                <div
                  key={wine.name}
                  className="overflow-hidden rounded-[24px] bg-white shadow-sm"
                >
                  <div className="relative aspect-[3/4] bg-[#EFE9DE]">
                    <Image
                      src={wine.image}
                      alt={wine.name}
                      fill
                      className="object-contain p-2"
                    />
                  </div>

                  <div className="p-3">
                    <p className="text-sm font-semibold">
                      {wine.name}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-[#722F37]">
                      €{wine.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MIELE */}
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">
                Miele
              </h3>

              <span className="text-xs text-neutral-400">
                3 varietà
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {honeyProducts.map((item) => (
                <div
                  key={item.name}
                  className="overflow-hidden rounded-[24px] bg-white shadow-sm"
                >
                  <div className="relative aspect-square bg-[#F0EBDD]">
                    <Image
                      src={item.image}
                      alt={`Miele ${item.name}`}
                      fill
                      className="object-contain p-2"
                    />
                  </div>

                  <div className="p-3">
                    <p className="text-sm font-semibold">
                      {item.name}
                    </p>

                    <p className="mt-1 text-xs font-medium text-[#606C38]">
                      da €{item.fromPrice}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MAGAZZINO */}
        <section className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
                Stock
              </p>

              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                Magazzino
              </h2>
            </div>

            <span className="text-xs text-neutral-400">
              Disponibilità
            </span>
          </div>

          {/* STOCK VINO */}
          <div className="mt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#722F37]">
              Vino
            </p>

            <div className="space-y-3">
              {wines.map((wine) => (
                <div
                  key={wine.name}
                  className="rounded-[22px] bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">

                    {/* FOTO VINO */}
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#EFE9DE]">
                      <Image
                        src={wine.image}
                        alt={wine.name}
                        fill
                        className="object-contain p-1"
                      />
                    </div>

                    {/* NOME */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        {wine.name}
                      </p>

                      <p className="mt-1 text-xs text-neutral-400">
                        Vino
                      </p>
                    </div>

                    {/* STOCK */}
                    <div className="text-right">
                      <p className="text-2xl font-semibold tracking-tight">
                        {wine.stock}
                      </p>

                      <p className="text-[11px] text-neutral-400">
                        bottiglie
                      </p>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STOCK MIELE */}
          <div className="mt-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#606C38]">
              Miele
            </p>

            <div className="space-y-3">
              {honey.map((item) => (
                <div
                  key={`${item.name}-${item.size}`}
                  className="rounded-[22px] bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">

                    {/* FOTO MIELE */}
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#F0EBDD]">
                      <Image
                        src={item.image}
                        alt={`${item.name} ${item.size}`}
                        fill
                        className="object-contain p-1"
                      />
                    </div>

                    {/* NOME */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        {item.name}
                      </p>

                      <p className="mt-1 text-xs text-neutral-400">
                        {item.size}
                      </p>
                    </div>

                    {/* STOCK */}
                    <div className="text-right">
                      <p className="text-2xl font-semibold tracking-tight">
                        {item.stock}
                      </p>

                      <p className="text-[11px] text-neutral-400">
                        vasetti
                      </p>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="pb-8 pt-12 text-center">
          <div className="relative mx-auto h-14 w-14">
            <Image
              src="/logo-monteromola.png"
              alt="Tenuta Monteromola"
              fill
              className="object-contain opacity-60"
            />
          </div>

          <p className="mt-2 text-xs text-neutral-400">
            Tenuta Monteromola
          </p>
        </footer>

      </div>

      <BottomNav />
    </main>
  );
}