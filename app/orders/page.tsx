import Link from "next/link";
import Image from "next/image";

import { supabase } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";
import MarkAsPaidButton from "@/components/MarkAsPaidButton";
import DeleteOrderButton from "@/components/DeleteOrderButton";

type OrderItem = {
  id: number;
  product_id: string | null;
  product_name: string;
  variant: string | null;
  category: string | null;
  quantity: number;
  unit_price: number;
};

type Order = {
  id: number;
  order_date: string;

  customer: string | null;

  subtotal: number | null;
  discount_percent: number | null;
  is_gift: boolean | null;

  total: number;

  payment_method: string | null;
  payment_status: string | null;

  box_quantity: number | null;
  box_cost: number | null;

  notes: string | null;

  order_items: OrderItem[];
};

/*
|--------------------------------------------------------------------------
| CARICAMENTO ORDINI
|--------------------------------------------------------------------------
*/

async function getOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      order_date,
      customer,
      subtotal,
      discount_percent,
      is_gift,
      total,
      payment_method,
      payment_status,
      box_quantity,
      box_cost,
      notes,
      order_items (
        id,
        product_id,
        product_name,
        variant,
        category,
        quantity,
        unit_price
      )
    `)
    .order("order_date", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Errore caricamento ordini:",
      error
    );

    return [];
  }

  return (data || []) as Order[];
}

/*
|--------------------------------------------------------------------------
| FORMATTAZIONE
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| STATO PAGAMENTO
|--------------------------------------------------------------------------
*/

function getStatusClasses(
  status: string | null
) {
  if (status === "Pagato") {
    return "bg-[#606C38]/10 text-[#606C38]";
  }

  if (
    status === "In attesa di pagamento"
  ) {
    return "bg-[#C6924B]/15 text-[#9A682A]";
  }

  if (status === "Regalo") {
    return "bg-[#722F37]/10 text-[#722F37]";
  }

  return "bg-neutral-100 text-neutral-500";
}

/*
|--------------------------------------------------------------------------
| CALCOLO NETTO IVA
|--------------------------------------------------------------------------
|
| Vino  -> IVA 22%
| Miele -> IVA 10%
|
*/

function calculateNetRevenue(
  order: Order
) {
  if (
    order.payment_status !== "Pagato"
  ) {
    return 0;
  }

  if (order.is_gift) {
    return 0;
  }

  let wineGross = 0;
  let honeyGross = 0;
  let otherGross = 0;

  for (const item of order.order_items) {
    const lineTotal =
      Number(item.quantity) *
      Number(item.unit_price);

    if (item.category === "wine") {
      wineGross += lineTotal;
    } else if (
      item.category === "honey"
    ) {
      honeyGross += lineTotal;
    } else {
      otherGross += lineTotal;
    }
  }

  const discount =
    Number(
      order.discount_percent || 0
    ) / 100;

  const discountFactor =
    1 - discount;

  wineGross *= discountFactor;
  honeyGross *= discountFactor;
  otherGross *= discountFactor;

  const wineNet =
    wineGross / 1.22;

  const honeyNet =
    honeyGross / 1.1;

  return (
    wineNet +
    honeyNet +
    otherGross
  );
}

/*
|--------------------------------------------------------------------------
| IVA VENDITA
|--------------------------------------------------------------------------
*/

function calculateVat(order: Order) {
  if (
    order.payment_status !== "Pagato" ||
    order.is_gift
  ) {
    return 0;
  }

  const gross =
    Number(order.total || 0);

  const net =
    calculateNetRevenue(order);

  return Math.max(gross - net, 0);
}

/*
|--------------------------------------------------------------------------
| PAGINA
|--------------------------------------------------------------------------
*/

export default async function OrdersPage() {
  const orders = await getOrders();

  /*
  |--------------------------------------------------------------------------
  | PAGATI
  |--------------------------------------------------------------------------
  */

  const paidOrders = orders.filter(
    (order) =>
      order.payment_status === "Pagato" &&
      !order.is_gift
  );

  /*
  |--------------------------------------------------------------------------
  | IN ATTESA
  |--------------------------------------------------------------------------
  */

  const pendingOrders = orders.filter(
    (order) =>
      order.payment_status ===
      "In attesa di pagamento"
  );

  /*
  |--------------------------------------------------------------------------
  | REGALI
  |--------------------------------------------------------------------------
  */

  const giftOrders = orders.filter(
    (order) =>
      order.is_gift === true ||
      order.payment_status === "Regalo"
  );

  /*
  |--------------------------------------------------------------------------
  | FATTURATO INCASSATO
  |--------------------------------------------------------------------------
  */

  const totalRevenue =
    paidOrders.reduce(
      (sum, order) =>
        sum +
        Number(order.total || 0),
      0
    );

  /*
  |--------------------------------------------------------------------------
  | DA INCASSARE
  |--------------------------------------------------------------------------
  */

  const pendingRevenue =
    pendingOrders.reduce(
      (sum, order) =>
        sum +
        Number(order.total || 0),
      0
    );

  /*
  |--------------------------------------------------------------------------
  | NETTO IVA
  |--------------------------------------------------------------------------
  */

  const totalNetRevenue =
    paidOrders.reduce(
      (sum, order) =>
        sum +
        calculateNetRevenue(order),
      0
    );

  /*
  |--------------------------------------------------------------------------
  | IVA COMPLESSIVA
  |--------------------------------------------------------------------------
  */

  const totalVat =
    paidOrders.reduce(
      (sum, order) =>
        sum + calculateVat(order),
      0
    );

  return (
    <main className="min-h-screen bg-[#F7F3EA] text-[#27231F]">

      <div className="mx-auto max-w-md px-5 pb-32 pt-8">

        {/* ================================================================
            HEADER
        ================================================================= */}

        <header>

          <div className="flex items-center gap-4">

            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm">

              <Image
                src="/logo-monteromola.png"
                alt="Tenuta Monteromola"
                fill
                priority
                className="object-contain p-2"
              />

            </div>

            <div>

              <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#722F37]">
                Tenuta Monteromola
              </p>

              <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                Storico vendite
              </h1>

            </div>

          </div>

          <p className="mt-4 text-sm leading-6 text-neutral-500">
            Vendite, pagamenti e incassi della Tenuta.
          </p>

        </header>

        {/* ================================================================
            DASHBOARD ECONOMICA
        ================================================================= */}

        {orders.length > 0 && (

          <section className="mt-7 overflow-hidden rounded-[30px] bg-[#722F37] p-5 text-white shadow-lg">

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
              Fatturato incassato
            </p>

            <p className="mt-2 text-[40px] font-semibold leading-none tracking-tight">
              €{totalRevenue.toFixed(2)}
            </p>

            <p className="mt-2 text-xs text-white/45">
              Solo vendite pagate
            </p>

            {/* NETTO IVA */}

            <div className="mt-6 rounded-[22px] border border-white/[0.08] bg-white/[0.09] p-4">

              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                Ricavo netto IVA
              </p>

              <p className="mt-2 text-[28px] font-semibold">
                €{totalNetRevenue.toFixed(2)}
              </p>

              <div className="mt-3 flex items-center justify-between">

                <span className="text-[11px] text-white/45">
                  IVA compresa negli incassi
                </span>

                <span className="text-sm font-semibold text-white/70">
                  €{totalVat.toFixed(2)}
                </span>

              </div>

            </div>

            {/* NUMERI */}

            <div className="mt-3 grid grid-cols-2 gap-3">

              <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.08] p-4">

                <p className="text-xs text-white/45">
                  Vendite pagate
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {paidOrders.length}
                </p>

              </div>

              <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.08] p-4">

                <p className="text-xs text-white/45">
                  In attesa
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {pendingOrders.length}
                </p>

              </div>

            </div>

            {/* DA INCASSARE */}

            {pendingOrders.length > 0 && (

              <Link
                href="#pending"
                className="mt-3 flex items-center justify-between rounded-[20px] bg-[#C6924B]/30 p-4 transition active:scale-[0.99]"
              >

                <div>

                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">
                    Da incassare
                  </p>

                  <p className="mt-1 text-xs text-white/45">
                    {pendingOrders.length}{" "}
                    {pendingOrders.length === 1
                      ? "vendita in attesa"
                      : "vendite in attesa"}
                  </p>

                </div>

                <div className="text-right">

                  <p className="text-xl font-semibold">
                    €{pendingRevenue.toFixed(2)}
                  </p>

                  <p className="mt-1 text-[10px] text-white/45">
                    Gestisci →
                  </p>

                </div>

              </Link>

            )}

            {/* TOTALI */}

            <div className="mt-5 flex items-center justify-between">

              <div>

                <p className="text-xs text-white/45">
                  Vendite registrate
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

        {/* ================================================================
            REGALI
        ================================================================= */}

        {giftOrders.length > 0 && (

          <section className="mt-3">

            <div className="flex items-center justify-between rounded-[22px] bg-white p-4 shadow-sm">

              <div>

                <p className="text-sm font-semibold text-[#722F37]">
                  Regali
                </p>

                <p className="mt-1 text-xs text-neutral-400">
                  Prodotti usciti senza generare fatturato
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#722F37]/10 text-lg font-semibold text-[#722F37]">
                {giftOrders.length}
              </div>

            </div>

          </section>

        )}

        {/* ================================================================
            NESSUN ORDINE
        ================================================================= */}

        {orders.length === 0 && (

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

        )}

        {/* ================================================================
            DA INCASSARE
        ================================================================= */}

        {pendingOrders.length > 0 && (

          <section
            id="pending"
            className="mt-8 scroll-mt-6"
          >

            <div className="flex items-end justify-between gap-4">

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A46E2B]">
                  Pagamenti
                </p>

                <h2 className="mt-1 text-2xl font-semibold">
                  Da incassare
                </h2>

                <p className="mt-1 text-xs text-neutral-500">
                  {pendingOrders.length}{" "}
                  {pendingOrders.length === 1
                    ? "vendita in attesa"
                    : "vendite in attesa"}
                </p>

              </div>

              <div className="text-right">

                <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-400">
                  Totale
                </p>

                <p className="mt-1 text-xl font-semibold text-[#A46E2B]">
                  €{pendingRevenue.toFixed(2)}
                </p>

              </div>

            </div>

            <div className="mt-4 space-y-3">

              {pendingOrders.map((order) => (

                <article
                  key={order.id}
                  className="rounded-[26px] border border-[#C6924B]/20 bg-white p-5 shadow-sm"
                >

                  {/* CLIENTE */}

                  <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0">

                      <p className="truncate font-semibold">
                        {order.customer || "Vendita diretta"}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">

                        {formatDate(order.order_date)}

                        {order.payment_method
                          ? ` · ${order.payment_method}`
                          : ""}

                      </p>

                    </div>

                    <span className="shrink-0 rounded-full bg-[#C6924B]/15 px-3 py-1.5 text-[10px] font-semibold text-[#9A682A]">
                      IN ATTESA
                    </span>

                  </div>

                  {/* PRODOTTI */}

                  {order.order_items.length > 0 && (

                    <div className="mt-4 space-y-2 border-t border-black/5 pt-4">

                      {order.order_items.map((item) => {

                        const lineTotal =
                          Number(item.quantity) *
                          Number(item.unit_price);

                        return (

                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 text-sm"
                          >

                            <span className="min-w-0 text-neutral-600">

                              <span className="font-medium text-[#27231F]">
                                {item.quantity} ×
                              </span>{" "}

                              {item.product_name}

                              {item.variant
                                ? ` ${item.variant}`
                                : ""}

                            </span>

                            <span className="shrink-0 text-neutral-500">
                              €{lineTotal.toFixed(2)}
                            </span>

                          </div>

                        );
                      })}

                    </div>

                  )}

                  {/* SCONTO */}

                  {Number(
                    order.discount_percent || 0
                  ) > 0 && (

                    <div className="mt-4 flex items-center justify-between rounded-[17px] bg-[#F7F3EA] px-4 py-3">

                      <span className="text-xs text-neutral-500">
                        Sconto applicato
                      </span>

                      <span className="text-sm font-semibold text-[#722F37]">
                        −
                        {Number(
                          order.discount_percent
                        ).toFixed(0)}
                        %
                      </span>

                    </div>

                  )}

                  {/* TOTALE */}

                  <div className="mt-4 flex items-end justify-between border-t border-black/5 pt-4">

                    <div>

                      <p className="text-xs text-neutral-500">
                        Da incassare
                      </p>

                      <p className="mt-1 text-[10px] text-[#A46E2B]">
                        Non incluso nel fatturato
                      </p>

                    </div>

                    <p className="text-2xl font-semibold text-[#A46E2B]">
                      €{Number(order.total || 0).toFixed(2)}
                    </p>

                  </div>

                  {/* AZIONI */}

                  <div className="mt-4 space-y-2">

                    {/* SEGNA COME PAGATO */}

                    <MarkAsPaidButton
                      orderId={order.id}
                    />

                    {/* ELIMINA VENDITA */}

                    <DeleteOrderButton
                      orderId={order.id}
                      orderItems={order.order_items}
                    />

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

        {/* ================================================================
            STORICO GENERALE
        ================================================================= */}

        {orders.length > 0 && (

          <section className="mt-10">

            <div className="mb-4 flex items-end justify-between">

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#722F37]">
                  Storico
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  Tutte le vendite
                </h2>

              </div>

              <span className="text-xs text-neutral-400">
                Più recenti
              </span>

            </div>

            <div className="space-y-4">

              {orders.map((order) => {

                const isPaid =
                  order.payment_status ===
                  "Pagato";

                const isPending =
                  order.payment_status ===
                  "In attesa di pagamento";

                const isGift =
                  order.is_gift === true ||
                  order.payment_status ===
                    "Regalo";

                const orderNet =
                  calculateNetRevenue(order);

                const orderVat =
                  calculateVat(order);

                return (

                  <article
                    key={order.id}
                    className={`rounded-[28px] bg-white p-5 shadow-sm ${
                      isPending
                        ? "ring-1 ring-[#C6924B]/25"
                        : ""
                    }`}
                  >

                    {/* TOP */}

                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0">

                        <p className="truncate text-base font-semibold">
                          {order.customer ||
                            "Vendita diretta"}
                        </p>

                        <p className="mt-1 text-xs text-neutral-500">

                          {formatDate(
                            order.order_date
                          )}

                          {" · "}

                          {formatTime(
                            order.order_date
                          )}

                        </p>

                        {order.payment_method && (

                          <p className="mt-1 text-xs text-neutral-400">
                            {order.payment_method}
                          </p>

                        )}

                      </div>

                      {/* BADGE */}

                      <span
                        className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold ${getStatusClasses(
                          order.payment_status
                        )}`}
                      >

                        {isPaid
                          ? "✓ Pagato"
                          : isPending
                          ? "◷ In attesa"
                          : isGift
                          ? "Regalo"
                          : order.payment_status ||
                            "—"}

                      </span>

                    </div>

                    {/* PRODOTTI */}

                    <div className="mt-5 space-y-3">

                      {order.order_items.map(
                        (item) => {

                          const lineTotal =
                            Number(
                              item.quantity
                            ) *
                            Number(
                              item.unit_price
                            );

                          return (

                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-4 text-sm"
                            >

                              <span className="min-w-0">

                                <span className="font-medium">
                                  {item.quantity} ×
                                </span>{" "}

                                {item.product_name}

                                {item.variant
                                  ? ` ${item.variant}`
                                  : ""}

                              </span>

                              <span className="shrink-0 text-neutral-500">
                                €{lineTotal.toFixed(2)}
                              </span>

                            </div>

                          );
                        }
                      )}

                    </div>

                    {/* SCONTO */}

                    {!isGift &&
                      Number(
                        order.discount_percent || 0
                      ) > 0 && (

                        <div className="mt-4 flex items-center justify-between rounded-[17px] bg-[#F7F3EA] px-4 py-3">

                          <span className="text-xs text-neutral-500">
                            Sconto
                          </span>

                          <span className="text-sm font-semibold text-[#722F37]">
                            −
                            {Number(
                              order.discount_percent
                            ).toFixed(0)}
                            %
                          </span>

                        </div>

                      )}

                    {/* REGALO */}

                    {isGift && (

                      <div className="mt-4 rounded-[17px] bg-[#722F37]/5 px-4 py-3">

                        <p className="text-xs font-semibold text-[#722F37]">
                          Vendita registrata come regalo
                        </p>

                        <p className="mt-1 text-[11px] text-neutral-500">
                          I prodotti sono stati rimossi dal magazzino
                          ma il prezzo di vendita registrato è €0.
                        </p>

                      </div>

                    )}

                    {/* TOTALE */}

                    <div className="mt-5 border-t border-black/5 pt-4">

                      <div className="flex items-end justify-between">

                        <div>

                          <span className="text-sm text-neutral-500">

                            {isGift
                              ? "Prezzo registrato"
                              : isPending
                              ? "Da incassare"
                              : "Totale"}

                          </span>

                          {isPending && (

                            <p className="mt-1 text-[10px] text-[#9A682A]">
                              Non incluso nel fatturato
                            </p>

                          )}

                        </div>

                        <span
                          className={`text-2xl font-semibold tracking-tight ${
                            isPending
                              ? "text-[#9A682A]"
                              : ""
                          }`}
                        >
                          €
                          {Number(
                            order.total || 0
                          ).toFixed(2)}
                        </span>

                      </div>

                    </div>

                    {/* IVA */}

                    {isPaid &&
                      !isGift && (

                        <div className="mt-4 rounded-[18px] bg-[#F7F3EA] p-4">

                          <div className="flex items-center justify-between">

                            <span className="text-xs text-neutral-500">
                              Ricavo netto IVA
                            </span>

                            <span className="text-sm font-semibold">
                              €{orderNet.toFixed(2)}
                            </span>

                          </div>

                          <div className="mt-2 flex items-center justify-between">

                            <span className="text-xs text-neutral-400">
                              IVA
                            </span>

                            <span className="text-xs font-medium text-neutral-500">
                              €{orderVat.toFixed(2)}
                            </span>

                          </div>

                        </div>

                      )}

                    {/* AZIONI */}

                    <div className="mt-4 space-y-2">

                      {/* SOLO LE VENDITE IN ATTESA POSSONO ESSERE SEGNATE COME PAGATE */}

                      {isPending && (
                        <MarkAsPaidButton
                          orderId={order.id}
                        />
                      )}

                      {/* TUTTE LE VENDITE POSSONO ESSERE ELIMINATE */}

                      <DeleteOrderButton
                        orderId={order.id}
                        orderItems={order.order_items}
                      />

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

                );
              })}

            </div>

          </section>

        )}

        {/* ================================================================
            CTA
        ================================================================= */}

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