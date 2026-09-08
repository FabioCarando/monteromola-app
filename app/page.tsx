import Link from "next/link";
import { supabase } from "@/lib/supabase";

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

  const revenue = orders.reduce((sum, order) => {
    return sum + Number(order.total);
  }, 0);

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
    { name: "Onelia", stock: 0 },
    { name: "Gea", stock: 0 },
    { name: "Giulio", stock: 0 },
  ];

  const honey = [
    { name: "Acacia", size: "250g", stock: 0 },
    { name: "Acacia", size: "500g", stock: 0 },
    { name: "Millefiori", size: "250g", stock: 0 },
    { name: "Millefiori", size: "500g", stock: 0 },
    { name: "Melata", size: "250g", stock: 0 },
    { name: "Melata", size: "500g", stock: 0 },
  ];

  return (
    <main className="min-h-screen bg-[#F7F3EA] text-[#27231F]">
      <div className="mx-auto max-w-md px-5 py-8">

        <header>
          <p className="text-sm uppercase tracking-[0.25em] text-[#722F37]">
            Tenuta Monteromola
          </p>

          <h1 className="mt-3 text-4xl font-semibold">
            Buongiorno, Elena
          </h1>

          <p className="mt-2 text-sm text-neutral-600">
            Il tuo workspace per vendite, ordini e magazzino.
          </p>
        </header>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-500">
            Vendite questo mese
          </p>

          <p className="mt-2 text-4xl font-semibold">
            €{revenue.toFixed(2)}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">

            <div className="rounded-2xl bg-[#F7F3EA] p-4">
              <p className="text-xs text-neutral-500">
                Ordini
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {ordersCount}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F7F3EA] p-4">
              <p className="text-xs text-neutral-500">
                Prodotti venduti
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {productsSold}
              </p>
            </div>

          </div>
        </section>

        <Link
          href="/sales/new"
          className="mt-6 block w-full rounded-2xl bg-[#722F37] px-5 py-4 text-center text-lg font-medium text-white shadow-sm transition hover:opacity-90"
        >
          + Nuova vendita
        </Link>

        <Link
          href="/orders"
          className="mt-3 block w-full rounded-2xl border border-[#722F37]/20 bg-white px-5 py-4 text-center font-medium text-[#722F37] shadow-sm"
        >
          Storico vendite
        </Link>

        <section className="mt-10">

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Magazzino
            </h2>

            <span className="text-sm text-neutral-500">
              Disponibilità
            </span>
          </div>

          <div className="mt-6">

            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#722F37]">
              Vino
            </p>

            <div className="space-y-3">

              {wines.map((wine) => (
                <div
                  key={wine.name}
                  className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm"
                >
                  <div>
                    <p className="font-medium">
                      {wine.name}
                    </p>

                    <p className="mt-1 text-xs text-neutral-400">
                      Vino
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      {wine.stock}
                    </p>

                    <p className="text-xs text-neutral-400">
                      bottiglie
                    </p>
                  </div>
                </div>
              ))}

            </div>
          </div>

          <div className="mt-8">

            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#606C38]">
              Miele
            </p>

            <div className="space-y-3">

              {honey.map((item) => (
                <div
                  key={`${item.name}-${item.size}`}
                  className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm"
                >
                  <div>
                    <p className="font-medium">
                      {item.name}
                    </p>

                    <p className="mt-1 text-xs text-neutral-400">
                      {item.size}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      {item.stock}
                    </p>

                    <p className="text-xs text-neutral-400">
                      vasetti
                    </p>
                  </div>
                </div>
              ))}

            </div>
          </div>

        </section>

        <footer className="pb-8 pt-12 text-center">
          <p className="text-xs text-neutral-400">
            Tenuta Monteromola
          </p>
        </footer>

      </div>
    </main>
  );
}