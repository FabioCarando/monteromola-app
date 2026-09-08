import Link from "next/link";
import { supabase } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";

type OrderItem = {
  id: number;
  product_name: string;
  variant: string | null;
  quantity: number;
  unit_price: number;
};

type Order = {
  id: number;
  order_date: string;
  customer: string | null;
  total: number;
  payment_method: string | null;
  payment_status: string | null;
  box_quantity: number;
  box_cost: number;
  notes: string | null;
  order_items: OrderItem[];
};

async function getOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      order_date,
      customer,
      total,
      payment_method,
      payment_status,
      box_quantity,
      box_cost,
      notes,
      order_items (
        id,
        product_name,
        variant,
        quantity,
        unit_price
      )
    `)
    .order("order_date", { ascending: false });

  if (error) {
    console.error("Errore caricamento ordini:", error);
    return [];
  }

  return (data || []) as Order[];
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default async function OrdersPage() {
  const orders = await getOrders();

  const totalRevenue = orders.reduce(
    (sum, order) => sum + Number(order.total),
    0
  );

  return (
    <main className="min-h-screen bg-[#F7F3EA] text-[#27231F]">
      <div className="mx-auto max-w-md px-5 pb-32 pt-8">

        {/* HEADER */}
        <header>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#722F37]">
            Tenuta Monteromola
          </p>

          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Storico vendite
              </h1>

              <p className="mt-2 text-sm text-neutral-500">
                Tutti gli ordini registrati.
              </p>
            </div>

            <Link
              href="/"
              className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm active:scale-[0.97]"
            >
              Home
            </Link>
          </div>
        </header>

        {/* SUMMARY */}
        {orders.length > 0 && (
          <section className="mt-7 rounded-[28px] bg-[#722F37] p-5 text-white shadow-lg">
            <p className="text-xs uppercase tracking-[0.18em] text-white/60">
              Totale storico
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight">
              €{totalRevenue.toFixed(2)}
            </p>

            <div className="mt-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-white/60">
                  Ordini registrati
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {orders.length}
                </p>
              </div>

              <Link
                href="/sales/new"
                className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium backdrop-blur active:scale-[0.97]"
              >
                + Nuova vendita
              </Link>
            </div>
          </section>
        )}

        {/* NESSUN ORDINE */}
        {orders.length === 0 ? (
          <section className="mt-8 rounded-[28px] bg-white p-7 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#722F37]/10 text-2xl text-[#722F37]">
              +
            </div>

            <p className="mt-4 text-lg font-semibold">
              Nessuna vendita
            </p>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Le vendite registrate compariranno qui.
            </p>

            <Link
              href="/sales/new"
              className="mt-5 block w-full rounded-2xl bg-[#722F37] px-5 py-4 text-center font-semibold text-white active:scale-[0.98]"
            >
              Registra la prima vendita
            </Link>
          </section>
        ) : (
          <section className="mt-8">

            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Vendite
              </h2>

              <span className="text-xs text-neutral-400">
                Più recenti
              </span>
            </div>

            <div className="space-y-4">

              {orders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-[28px] bg-white p-5 shadow-sm"
                >
                  {/* TOP */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold">
                        {order.customer || "Vendita diretta"}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        {formatDate(order.order_date)}
                        {" · "}
                        {formatTime(order.order_date)}
                      </p>

                      {order.payment_method && (
                        <p className="mt-1 text-xs text-neutral-400">
                          {order.payment_method}
                        </p>
                      )}
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                        order.payment_status === "Pagato"
                          ? "bg-[#606C38]/10 text-[#606C38]"
                          : "bg-[#722F37]/10 text-[#722F37]"
                      }`}
                    >
                      {order.payment_status || "—"}
                    </span>
                  </div>

                  {/* PRODOTTI */}
                  <div className="mt-5 space-y-3">

                    {order.order_items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 text-sm"
                      >
                        <span>
                          <span className="font-medium">
                            {item.quantity} ×
                          </span>{" "}
                          {item.product_name}
                          {item.variant
                            ? ` ${item.variant}`
                            : ""}
                        </span>

                        <span className="shrink-0 text-neutral-500">
                          €
                          {(
                            item.quantity * item.unit_price
                          ).toFixed(2)}
                        </span>
                      </div>
                    ))}

                    {order.box_quantity > 0 && (
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-neutral-500">
                          {order.box_quantity} × scatola
                        </span>

                        <span className="shrink-0 text-neutral-500">
                          €
                          {(
                            order.box_quantity *
                            order.box_cost
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}

                  </div>

                  {/* TOTALE */}
                  <div className="mt-5 border-t border-black/5 pt-4">
                    <div className="flex items-end justify-between">
                      <span className="text-sm text-neutral-500">
                        Totale
                      </span>

                      <span className="text-2xl font-semibold tracking-tight">
                        €{Number(order.total).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* NOTE */}
                  {order.notes && (
                    <div className="mt-4 rounded-2xl bg-[#F7F3EA] p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                        Note
                      </p>

                      <p className="mt-2 text-sm leading-5">
                        {order.notes}
                      </p>
                    </div>
                  )}
                </article>
              ))}

            </div>
          </section>
        )}

        {/* CTA FINALE */}
        {orders.length > 0 && (
          <Link
            href="/sales/new"
            className="mt-8 block w-full rounded-[22px] bg-[#27231F] px-5 py-4 text-center font-semibold text-white shadow-sm active:scale-[0.98]"
          >
            + Registra una vendita
          </Link>
        )}

      </div>

      <BottomNav />
    </main>
  );
}