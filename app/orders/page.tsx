import Link from "next/link";
import { supabase } from "@/lib/supabase";

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

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <main className="min-h-screen bg-[#F7F3EA] text-[#27231F]">
      <div className="mx-auto max-w-md px-5 py-8">
        <header className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#722F37]">
              Tenuta Monteromola
            </p>

            <h1 className="mt-3 text-3xl font-semibold">
              Storico vendite
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              Tutti gli ordini registrati.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-full bg-white px-4 py-2 text-sm shadow-sm"
          >
            Home
          </Link>
        </header>

        {orders.length === 0 ? (
        <section className="mt-10 rounded-3xl bg-white p-6 text-center shadow-sm">
            <p className="text-lg font-semibold">
            Nessuna vendita
            </p>

            <p className="mt-2 text-sm text-neutral-500">
            Le vendite registrate compariranno qui.
            </p>
        </section>
        ) : (
          <div className="mt-8 space-y-4">
            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-3xl bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      {order.customer || "Vendita diretta"}
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      {formatDate(order.order_date)}
                      {order.payment_method
                        ? ` · ${order.payment_method}`
                        : ""}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      order.payment_status === "Pagato"
                        ? "bg-[#606C38]/10 text-[#606C38]"
                        : "bg-[#722F37]/10 text-[#722F37]"
                    }`}
                  >
                    {order.payment_status || "—"}
                  </span>
                </div>

                <div className="mt-5 space-y-2">
                  {order.order_items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>
                        {item.quantity} × {item.product_name}
                        {item.variant ? ` ${item.variant}` : ""}
                      </span>

                      <span className="text-neutral-500">
                        €
                        {(item.quantity * item.unit_price).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {order.box_quantity > 0 && (
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-neutral-500">
                      {order.box_quantity} × scatola
                    </span>

                    <span className="text-neutral-500">
                      €
                      {(order.box_quantity * order.box_cost).toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="mt-5 border-t border-black/5 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">
                      Totale ordine
                    </span>

                    <span className="text-xl font-semibold">
                      €{Number(order.total).toFixed(2)}
                    </span>
                  </div>
                </div>

                {order.notes && (
                  <div className="mt-4 rounded-2xl bg-[#F7F3EA] p-3">
                    <p className="text-xs text-neutral-500">
                      Note
                    </p>

                    <p className="mt-1 text-sm">
                      {order.notes}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        <Link
          href="/sales/new"
          className="mt-8 block w-full rounded-2xl bg-[#722F37] px-5 py-4 text-center text-lg font-medium text-white shadow-sm"
        >
          + Nuova vendita
        </Link>
      </div>
    </main>
  );
}