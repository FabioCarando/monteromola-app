import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";

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
    console.error("Errore caricamento report:", error);
    return [];
  }

  return (data || []) as Order[];
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default async function ReportsPage() {
  const orders = await getOrders();

  const totalRevenue = orders.reduce(
    (sum, order) => sum + Number(order.total),
    0
  );

  const totalProducts = orders.reduce(
    (sum, order) =>
      sum +
      order.order_items.reduce(
        (itemSum, item) => itemSum + item.quantity,
        0
      ),
    0
  );

  return (
    <main className="min-h-screen bg-[#FCFAF5] text-[#211F1C]">
      <div className="mx-auto max-w-7xl px-5 pb-32 pt-6">

        {/* HEADER */}
        <header>
          <div className="flex items-center justify-between">

            <Link
              href="/orders"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm"
            >
              <ArrowLeft size={19} />
            </Link>

            <div className="relative h-12 w-12">
              <Image
                src="/logo-monteromola.png"
                alt="Tenuta Monteromola"
                fill
                className="object-contain"
              />
            </div>

            <div className="h-11 w-11" />
          </div>

          <div className="mt-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6F2636]">
              Tenuta Monteromola
            </p>

            <h1 className="monteromola-serif mt-1 text-[38px] leading-none">
              Report vendite
            </h1>

            <p className="mt-3 text-sm text-[#817B73]">
              Consulta i dati e scarica il report completo in Excel.
            </p>
          </div>
        </header>

        {/* SUMMARY */}
        <section className="mt-7 grid grid-cols-3 gap-3">
          <div className="rounded-[24px] bg-[#641F30] p-5 text-white">
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/50">
              Fatturato
            </p>

            <p className="monteromola-serif mt-2 text-[29px]">
              €{totalRevenue.toFixed(2)}
            </p>
          </div>

          <div className="rounded-[24px] bg-white p-5 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#99938A]">
              Vendite
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {orders.length}
            </p>
          </div>

          <div className="rounded-[24px] bg-white p-5 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#99938A]">
              Prodotti
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {totalProducts}
            </p>
          </div>
        </section>

        {/* DOWNLOAD */}
        <a
          href="/api/orders/export"
          className="mt-5 flex w-full items-center justify-between rounded-[23px] bg-[#211F1C] px-5 py-[17px] text-white shadow-sm md:w-fit md:min-w-[250px]"
        >
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={20} />

            <div>
              <p className="text-sm font-semibold">
                Scarica Excel
              </p>

              <p className="mt-0.5 text-[10px] text-white/50">
                Tutte le vendite
              </p>
            </div>
          </div>

          <Download size={18} />
        </a>

        {/* TABLE */}
        <section className="mt-8 overflow-hidden rounded-[28px] bg-white shadow-sm">

          {orders.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#817B73]">
              Nessuna vendita disponibile.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full text-left text-sm">

                <thead className="bg-[#F1EDE5]">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      Data
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Ora
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Cliente
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Prodotti
                    </th>

                    <th className="px-5 py-4 text-center font-semibold">
                      Q.tà
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Pagamento
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Stato
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Note
                    </th>

                    <th className="px-5 py-4 text-right font-semibold">
                      Totale
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => {
                    const quantity = order.order_items.reduce(
                      (sum, item) => sum + item.quantity,
                      0
                    );

                    const products = order.order_items
                      .map(
                        (item) =>
                          `${item.quantity}× ${item.product_name}${
                            item.variant
                              ? ` ${item.variant}`
                              : ""
                          }`
                      )
                      .join(", ");

                    return (
                      <tr
                        key={order.id}
                        className="border-b border-black/[0.045] last:border-0"
                      >
                        <td className="whitespace-nowrap px-5 py-4">
                          {formatDate(order.order_date)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-[#817B73]">
                          {formatTime(order.order_date)}
                        </td>

                        <td className="px-5 py-4 font-semibold">
                          {order.customer ||
                            "Vendita diretta"}
                        </td>

                        <td className="max-w-[350px] px-5 py-4 text-[#5F5A54]">
                          {products}
                        </td>

                        <td className="px-5 py-4 text-center">
                          {quantity}
                        </td>

                        <td className="px-5 py-4">
                          {order.payment_method || "—"}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              order.payment_status ===
                              "Pagato"
                                ? "bg-[#657052]/10 text-[#657052]"
                                : "bg-[#6F2636]/10 text-[#6F2636]"
                            }`}
                          >
                            {order.payment_status || "—"}
                          </span>
                        </td>

                        <td className="max-w-[250px] px-5 py-4 text-[#817B73]">
                          {order.notes || "—"}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right font-semibold">
                          €
                          {Number(order.total).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

              </table>
            </div>
          )}

        </section>

      </div>

      <BottomNav />
    </main>
  );
}