import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";
import DeleteOrderButton from "@/components/DeleteOrderButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  const totalProducts = orders.reduce((sum, order) => {
    const orderProducts = order.order_items.reduce(
      (itemSum, item) => itemSum + item.quantity,
      0
    );

    return sum + orderProducts;
  }, 0);

  return (
    <main className="min-h-screen bg-[#FCFAF5] text-[#211F1C]">
      <div className="mx-auto max-w-md px-5 pb-32 pt-7 md:max-w-6xl">

        {/* HEADER */}
        <header>
          <div className="flex items-center gap-4">

            <div className="relative h-16 w-16 shrink-0">
              <Image
                src="/logo-monteromola.png"
                alt="Tenuta Monteromola"
                fill
                priority
                className="object-contain"
              />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.23em] text-[#6F2636]">
                Tenuta Monteromola
              </p>

              <h1 className="monteromola-serif mt-1 text-[35px] leading-none tracking-[-0.025em]">
                Storico vendite
              </h1>
            </div>

          </div>

          <p className="mt-4 text-sm leading-6 text-[#817B73]">
            Tutte le vendite registrate dalla Tenuta.
          </p>
        </header>

        {/* SUMMARY */}
        {orders.length > 0 && (
          <section className="relative mt-7 overflow-hidden rounded-[34px] bg-[#641F30] p-6 text-white shadow-[0_20px_50px_rgba(91,28,42,0.18)]">

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
              Totale storico
            </p>

            <p className="monteromola-serif mt-3 text-[48px] leading-none tracking-[-0.035em]">
              €{totalRevenue.toFixed(0)}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">

              <div className="rounded-[20px] bg-white/10 p-4">
                <p className="text-xs text-white/55">
                  Ordini
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {orders.length}
                </p>
              </div>

              <div className="rounded-[20px] bg-white/10 p-4">
                <p className="text-xs text-white/55">
                  Prodotti
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {totalProducts}
                </p>
              </div>

            </div>
          </section>
        )}

        {/* NUOVA VENDITA */}
        <Link
          href="/sales/new"
          className="mt-5 flex w-full items-center justify-center rounded-[23px] bg-[#211F1C] px-5 py-[17px] font-semibold text-white shadow-sm"
        >
          + Registra una vendita
        </Link>
        <Link
          href="/reports"
          className="mt-3 flex w-full items-center justify-center rounded-[23px] border border-[#6F2636]/15 bg-white px-5 py-[16px] font-semibold text-[#6F2636]"
        >
          Report vendite ed Excel
        </Link>

        {/* NESSUN ORDINE */}
        {orders.length === 0 ? (
          <section className="mt-8 rounded-[28px] bg-white p-7 text-center shadow-sm">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#6F2636]/10 text-2xl text-[#6F2636]">
              +
            </div>

            <p className="monteromola-serif mt-5 text-[27px]">
              Nessuna vendita
            </p>

            <p className="mt-2 text-sm leading-6 text-[#817B73]">
              Le vendite registrate compariranno qui.
            </p>

          </section>
        ) : (
          <section className="mt-11">

            <div className="mb-5 flex items-end justify-between">

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#99938A]">
                  Attività
                </p>

                <h2 className="monteromola-serif mt-1 text-[31px]">
                  Vendite
                </h2>
              </div>

              <span className="text-xs text-[#9A948C]">
                Più recenti
              </span>

            </div>

            {/* CARD MOBILE */}
            <div className="space-y-4 md:hidden">

              {orders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-[29px] bg-white p-5 shadow-[0_8px_30px_rgba(30,26,21,0.04)]"
                >

                  {/* TOP */}
                  <div className="flex items-start justify-between gap-4">

                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">
                        {order.customer || "Vendita diretta"}
                      </p>

                      <p className="mt-1 text-xs text-[#918B83]">
                        {formatDate(order.order_date)}
                        {" · "}
                        {formatTime(order.order_date)}
                      </p>

                      {order.payment_method && (
                        <p className="mt-1 text-xs text-[#AAA49B]">
                          {order.payment_method}
                        </p>
                      )}
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                        order.payment_status === "Pagato"
                          ? "bg-[#657052]/10 text-[#657052]"
                          : "bg-[#6F2636]/10 text-[#6F2636]"
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
                        <span className="min-w-0 text-[#5F5A54]">
                          <span className="font-semibold text-[#211F1C]">
                            {item.quantity} ×
                          </span>{" "}
                          {item.product_name}
                          {item.variant
                            ? ` ${item.variant}`
                            : ""}
                        </span>

                        <span className="shrink-0 text-[#89837B]">
                          €
                          {(
                            item.quantity *
                            item.unit_price
                          ).toFixed(2)}
                        </span>
                      </div>
                    ))}

                    {order.box_quantity > 0 && (
                      <div className="flex items-center justify-between text-sm text-[#918B83]">

                        <span>
                          {order.box_quantity} × scatola
                        </span>

                        <span>
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
                  <div className="mt-5 border-t border-black/[0.05] pt-4">

                    <div className="flex items-end justify-between">

                      <span className="text-xs text-[#918B83]">
                        Totale
                      </span>

                      <span className="monteromola-serif text-[29px] leading-none">
                        €{Number(order.total).toFixed(2)}
                      </span>

                    </div>

                  </div>

                  {/* NOTE */}
                  {order.notes && (
                    <div className="mt-4 rounded-[19px] bg-[#F5F1E9] p-4">

                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#AAA49B]">
                        Note
                      </p>

                      <p className="mt-2 text-sm leading-5 text-[#5F5A54]">
                        {order.notes}
                      </p>

                    </div>
                  )}

                  {/* ELIMINA */}
                  <div className="mt-4 flex justify-end">
                    <DeleteOrderButton orderId={order.id} />
                  </div>

                </article>
              ))}

            </div>

            {/* TABELLA DESKTOP */}
            <div className="hidden overflow-hidden rounded-[28px] bg-white shadow-sm md:block">

              <div className="overflow-x-auto">

                <table className="min-w-full text-left text-sm">

                  <thead className="border-b border-black/[0.05] bg-[#F3EFE7]">

                    <tr>
                      <th className="px-5 py-4 font-semibold">
                        Data
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Cliente
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Prodotti
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Pagamento
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Stato
                      </th>

                      <th className="px-5 py-4 text-right font-semibold">
                        Totale
                      </th>

                      <th className="px-5 py-4 text-right font-semibold">
                        Azioni
                      </th>
                    </tr>

                  </thead>

                  <tbody>

                    {orders.map((order) => (
                      <tr
                        key={`table-${order.id}`}
                        className="border-b border-black/[0.045] last:border-0"
                      >

                        <td className="whitespace-nowrap px-5 py-4 text-[#817B73]">
                          {formatDate(order.order_date)}
                        </td>

                        <td className="px-5 py-4 font-semibold">
                          {order.customer || "Vendita diretta"}
                        </td>

                        <td className="px-5 py-4">

                          <div className="space-y-1">

                            {order.order_items.map((item) => (
                              <div key={`desktop-${item.id}`}>
                                {item.quantity} × {item.product_name}
                                {item.variant
                                  ? ` ${item.variant}`
                                  : ""}
                              </div>
                            ))}

                            {order.box_quantity > 0 && (
                              <div className="text-[#9A948C]">
                                {order.box_quantity} × scatola
                              </div>
                            )}

                          </div>

                        </td>

                        <td className="px-5 py-4">
                          {order.payment_method || "—"}
                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              order.payment_status === "Pagato"
                                ? "bg-[#657052]/10 text-[#657052]"
                                : "bg-[#6F2636]/10 text-[#6F2636]"
                            }`}
                          >
                            {order.payment_status || "—"}
                          </span>

                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right text-base font-semibold">
                          €{Number(order.total).toFixed(2)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <DeleteOrderButton orderId={order.id} />
                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>

            </div>

          </section>
        )}

        {/* FOOTER */}
        <footer className="pb-8 pt-14 text-center">

          <div className="relative mx-auto h-11 w-11 opacity-30">
            <Image
              src="/logo-monteromola.png"
              alt="Monteromola"
              fill
              className="object-contain"
            />
          </div>

          <p className="monteromola-serif mt-3 text-lg text-[#AAA49B]">
            Monteromola
          </p>

        </footer>

      </div>

      <BottomNav />
    </main>
  );
}