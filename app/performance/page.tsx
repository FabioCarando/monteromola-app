"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  ChevronUp,
  ChevronDown,
  Crown,
  Medal,
  TrendingUp,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";

type Order = {
  id: number;
  order_date: string;
  total: number;
};

type OrderItem = {
  id: number;
  order_id: number;
  product_id: string | null;
  product_name: string;
  variant: string | null;
  category: string | null;
  quantity: number;
  unit_price: number;
};

type MonthlyData = {
  key: string;
  label: string;
  fullLabel: string;
  revenue: number;
  orders: number;
};

type ProductRanking = {
  key: string;
  productId: string | null;
  name: string;
  variant: string | null;
  quantity: number;
  revenue: number;
};

const productImages: Record<string, string> = {
  onelia: "/onelia.png",
  gea: "/gea.png",
  giulio: "/giulio.png",

  "acacia-250": "/acacia.png",
  "acacia-500": "/acacia.png",

  "millefiori-250": "/millefiori.png",
  "millefiori-500": "/millefiori.png",

  "melata-250": "/melata.png",
  "melata-500": "/melata.png",

  "box-wine": "/scatolavino.png",
  "box-honey": "/scatolamiele.png",
};

const monthFormatter = new Intl.DateTimeFormat("it-IT", {
  month: "short",
});

const fullMonthFormatter = new Intl.DateTimeFormat("it-IT", {
  month: "long",
  year: "numeric",
});

function capitalize(value: string) {
  if (!value) return value;

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

export default function PerformancePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setErrorMessage("");

      /*
       * Recuperiamo abbastanza storico da costruire
       * il grafico degli ultimi 6 mesi.
       */
      const startDate = new Date();

      startDate.setDate(1);
      startDate.setMonth(startDate.getMonth() - 5);
      startDate.setHours(0, 0, 0, 0);

      const { data: ordersData, error: ordersError } =
        await supabase
          .from("orders")
          .select(`
            id,
            order_date,
            total
          `)
          .gte(
            "order_date",
            startDate.toISOString()
          )
          .order("order_date", {
            ascending: true,
          });

      if (ordersError) {
        throw ordersError;
      }

      const loadedOrders =
        (ordersData || []) as Order[];

      setOrders(loadedOrders);

      if (loadedOrders.length === 0) {
        setOrderItems([]);
        return;
      }

      const orderIds = loadedOrders.map(
        (order) => order.id
      );

      const {
        data: itemsData,
        error: itemsError,
      } = await supabase
        .from("order_items")
        .select(`
          id,
          order_id,
          product_id,
          product_name,
          variant,
          category,
          quantity,
          unit_price
        `)
        .in("order_id", orderIds);

      if (itemsError) {
        throw itemsError;
      }

      setOrderItems(
        (itemsData || []) as OrderItem[]
      );
    } catch (error: any) {
      console.error(error);

      setErrorMessage(
        error?.message ||
          "Errore durante il caricamento delle performance."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ULTIMI 6 MESI
   */

  const months = useMemo(() => {
    const result: MonthlyData[] = [];

    const now = new Date();

    for (let offset = 5; offset >= 0; offset--) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - offset,
        1
      );

      result.push({
        key: getMonthKey(date),

        label: capitalize(
          monthFormatter
            .format(date)
            .replace(".", "")
        ),

        fullLabel: capitalize(
          fullMonthFormatter.format(date)
        ),

        revenue: 0,
        orders: 0,
      });
    }

    orders.forEach((order) => {
      const date = new Date(order.order_date);

      const key = getMonthKey(date);

      const month = result.find(
        (item) => item.key === key
      );

      if (!month) return;

      month.revenue += Number(order.total || 0);
      month.orders += 1;
    });

    return result;
  }, [orders]);

  const currentMonth =
    months[months.length - 1];

  const previousMonth =
    months[months.length - 2];

  const monthChange =
    previousMonth &&
    previousMonth.revenue > 0
      ? ((currentMonth.revenue -
          previousMonth.revenue) /
          previousMonth.revenue) *
        100
      : null;

  const sixMonthRevenue = months.reduce(
    (sum, month) => sum + month.revenue,
    0
  );

  const sixMonthOrders = months.reduce(
    (sum, month) => sum + month.orders,
    0
  );

  /*
   * Serve solo per dimensionare le barre.
   */
  const maxRevenue = Math.max(
    ...months.map(
      (month) => month.revenue
    ),
    1
  );

  /*
   * CLASSIFICA PRODOTTI
   */

  const ranking = useMemo(() => {
    const map = new Map<
      string,
      ProductRanking
    >();

    orderItems.forEach((item) => {
      /*
       * product_id è la chiave migliore.
       * Se manca, usiamo nome + variante.
       */
      const key =
        item.product_id ||
        `${item.product_name}-${item.variant || ""}`;

      const existing = map.get(key);

      const quantity =
        Number(item.quantity || 0);

      const revenue =
        quantity *
        Number(item.unit_price || 0);

      if (existing) {
        existing.quantity += quantity;
        existing.revenue += revenue;
      } else {
        map.set(key, {
          key,
          productId: item.product_id,
          name: item.product_name,
          variant: item.variant,
          quantity,
          revenue,
        });
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => {
        if (b.quantity !== a.quantity) {
          return b.quantity - a.quantity;
        }

        return b.revenue - a.revenue;
      }
    );
  }, [orderItems]);

  const bestSeller = ranking[0];

  function getProductImage(
    product: ProductRanking
  ) {
    if (
      product.productId &&
      productImages[product.productId]
    ) {
      return productImages[
        product.productId
      ];
    }

    return "/logo-monteromola.png";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FCFAF5]">
        <p className="text-sm text-[#817B73]">
          Caricamento andamento vendite...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FCFAF5] text-[#211F1C]">

      <div className="mx-auto max-w-md px-5 pb-[190px] pt-6">

        {/* HEADER */}

        <header>

          <div className="flex items-center justify-between">

            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
              aria-label="Torna alla home"
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

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2ECE5] text-[#6F2636]">
              <BarChart3 size={19} />
            </div>

          </div>

          <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6F2636]">
            Tenuta Monteromola
          </p>

          <h1 className="monteromola-serif mt-1 text-[39px] leading-none">
            Andamento vendite
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#817B73]">
            Performance, trend e prodotti più venduti.
          </p>

        </header>

        {/* HERO PERFORMANCE */}

        <section className="mt-7 overflow-hidden rounded-[32px] bg-[#5F2030] p-6 text-white shadow-[0_24px_60px_rgba(95,32,48,0.18)]">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
                Questo mese
              </p>

              <p className="monteromola-serif mt-2 text-[48px] leading-none">
                €
                {currentMonth.revenue.toFixed(
                  0
                )}
              </p>

            </div>

            {monthChange !== null && (
              <div
                className={`flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold ${
                  monthChange >= 0
                    ? "text-[#E2E9D6]"
                    : "text-[#F3CCCC]"
                }`}
              >

                {monthChange >= 0 ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}

                {Math.abs(
                  monthChange
                ).toFixed(0)}
                %

              </div>
            )}

          </div>

          <p className="mt-3 text-xs text-white/45">
            {currentMonth.orders}{" "}
            {currentMonth.orders === 1
              ? "vendita"
              : "vendite"}{" "}
            registrate
          </p>

          <div className="mt-7 grid grid-cols-2 gap-3">

            <div className="rounded-[20px] bg-white/[0.08] p-4">

              <p className="text-[11px] text-white/45">
                Ultimi 6 mesi
              </p>

              <p className="mt-1 text-xl font-semibold">
                €{sixMonthRevenue.toFixed(0)}
              </p>

            </div>

            <div className="rounded-[20px] bg-white/[0.08] p-4">

              <p className="text-[11px] text-white/45">
                Vendite
              </p>

              <p className="mt-1 text-xl font-semibold">
                {sixMonthOrders}
              </p>

            </div>

          </div>

        </section>

        {/* GRAFICO */}

        <section className="mt-10">

          <div className="flex items-end justify-between">

            <div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6F2636]">
                Trend
              </p>

              <h2 className="monteromola-serif mt-1 text-[30px]">
                Ultimi 6 mesi
              </h2>

            </div>

            <TrendingUp
              size={22}
              strokeWidth={1.6}
              className="text-[#6F2636]"
            />

          </div>

          <div className="mt-5 rounded-[30px] bg-white px-4 pb-5 pt-6 shadow-[0_10px_35px_rgba(30,26,21,0.04)]">

            {/* GRAFICO A BARRE */}

            <div className="flex h-[220px] items-end gap-2">

              {months.map(
                (month, index) => {
                  /*
                   * Manteniamo sempre un minimo
                   * visivo anche nei mesi a zero.
                   */
                  const percentage =
                    month.revenue > 0
                      ? Math.max(
                          (month.revenue /
                            maxRevenue) *
                            100,
                          8
                        )
                      : 3;

                  const isCurrent =
                    index ===
                    months.length - 1;

                  return (
                    <div
                      key={month.key}
                      className="flex h-full min-w-0 flex-1 flex-col justify-end"
                    >

                      <div className="flex flex-1 items-end justify-center">

                        <div
                          className={`relative w-full max-w-[42px] rounded-t-[14px] transition-all ${
                            isCurrent
                              ? "bg-[#6F2636]"
                              : "bg-[#E8DED8]"
                          }`}
                          style={{
                            height: `${percentage}%`,
                          }}
                        >

                          {month.revenue >
                            0 && (
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-semibold text-[#817B73]">
                              €
                              {month.revenue.toFixed(
                                0
                              )}
                            </div>
                          )}

                        </div>

                      </div>

                      <p
                        className={`mt-3 text-center text-[10px] font-semibold ${
                          isCurrent
                            ? "text-[#6F2636]"
                            : "text-[#9A948D]"
                        }`}
                      >
                        {month.label}
                      </p>

                    </div>
                  );
                }
              )}

            </div>

          </div>

        </section>

        {/* BEST SELLER */}

        {bestSeller && (
          <section className="mt-10">

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6F2636]">
              Best seller
            </p>

            <h2 className="monteromola-serif mt-1 text-[30px]">
              Il più venduto
            </h2>

            <div className="relative mt-4 overflow-hidden rounded-[30px] bg-[#F1EBE5] p-5">

              <div className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#6F2636] text-white">
                <Crown
                  size={17}
                  strokeWidth={1.7}
                />
              </div>

              <div className="flex items-center gap-5">

                <div className="relative h-[110px] w-[88px] shrink-0">

                  <Image
                    src={getProductImage(
                      bestSeller
                    )}
                    alt={bestSeller.name}
                    fill
                    className="object-contain"
                  />

                </div>

                <div className="min-w-0 pr-6">

                  <p className="monteromola-serif text-[27px] leading-none">
                    {bestSeller.name}
                  </p>

                  {bestSeller.variant && (
                    <p className="mt-2 text-xs text-[#817B73]">
                      {bestSeller.variant}
                    </p>
                  )}

                  <p className="mt-4 text-sm font-semibold text-[#6F2636]">
                    {bestSeller.quantity}{" "}
                    {bestSeller.quantity === 1
                      ? "unità venduta"
                      : "unità vendute"}
                  </p>

                  <p className="mt-1 text-xs text-[#817B73]">
                    €
                    {bestSeller.revenue.toFixed(
                      2
                    )}{" "}
                    di fatturato
                  </p>

                </div>

              </div>

            </div>

          </section>
        )}

        {/* CLASSIFICA */}

        <section className="mt-10">

          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#657052]">
            Prodotti
          </p>

          <h2 className="monteromola-serif mt-1 text-[30px]">
            Classifica vendite
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#817B73]">
            Ordinata per quantità venduta negli ultimi sei mesi.
          </p>

          {ranking.length > 0 ? (
            <div className="mt-5 space-y-3">

              {ranking.map(
                (product, index) => (
                  <div
                    key={product.key}
                    className="flex items-center gap-4 rounded-[24px] bg-white p-4 shadow-[0_8px_30px_rgba(30,26,21,0.035)]"
                  >

                    {/* POSIZIONE */}

                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        index === 0
                          ? "bg-[#6F2636] text-white"
                          : index === 1
                          ? "bg-[#DED7CF] text-[#4E4842]"
                          : index === 2
                          ? "bg-[#E9D8C8] text-[#74594A]"
                          : "bg-[#F3F0EB] text-[#918B83]"
                      }`}
                    >
                      {index < 3 ? (
                        <Medal
                          size={17}
                          strokeWidth={1.8}
                        />
                      ) : (
                        index + 1
                      )}
                    </div>

                    {/* FOTO */}

                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[16px] bg-[#F5F1EC]">

                      <Image
                        src={getProductImage(
                          product
                        )}
                        alt={product.name}
                        fill
                        className="object-contain p-1.5"
                      />

                    </div>

                    {/* INFO */}

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-sm font-semibold">
                        {product.name}
                      </p>

                      <p className="mt-1 text-xs text-[#918B83]">
                        {product.variant ||
                          "Prodotto"}
                      </p>

                    </div>

                    {/* NUMERI */}

                    <div className="text-right">

                      <p className="text-lg font-semibold text-[#211F1C]">
                        {product.quantity}
                      </p>

                      <p className="text-[10px] uppercase tracking-[0.08em] text-[#918B83]">
                        unità
                      </p>

                      <p className="mt-1 text-[11px] font-semibold text-[#6F2636]">
                        €
                        {product.revenue.toFixed(
                          0
                        )}
                      </p>

                    </div>

                  </div>
                )
              )}

            </div>
          ) : (
            <div className="mt-5 rounded-[24px] bg-white p-6 text-center">

              <BarChart3
                size={27}
                strokeWidth={1.5}
                className="mx-auto text-[#6F2636]"
              />

              <p className="mt-3 text-sm font-semibold">
                Nessuna vendita disponibile
              </p>

              <p className="mt-1 text-xs text-[#918B83]">
                La classifica apparirà dopo le prime vendite.
              </p>

            </div>
          )}

        </section>

        {errorMessage && (
          <div className="mt-8 rounded-[20px] bg-red-50 p-4 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

      </div>

      <BottomNav />

    </main>
  );
}