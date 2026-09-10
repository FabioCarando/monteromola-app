import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: orders, error } = await supabase
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
          category,
          quantity,
          unit_price
        )
      `)
      .order("order_date", { ascending: false });

    if (error) {
      throw error;
    }

    const salesRows = (orders || []).map((order: any) => {
      const date = new Date(order.order_date);

      const products = (order.order_items || [])
        .map(
          (item: any) =>
            `${item.quantity} x ${item.product_name}${
              item.variant ? ` ${item.variant}` : ""
            }`
        )
        .join(", ");

      const quantity = (order.order_items || []).reduce(
        (sum: number, item: any) =>
          sum + Number(item.quantity),
        0
      );

      return {
        "ID Vendita": order.id,

        Data: new Intl.DateTimeFormat("it-IT").format(
          date
        ),

        Ora: new Intl.DateTimeFormat("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(date),

        Cliente:
          order.customer || "Vendita diretta",

        Prodotti: products,

        "Quantità prodotti": quantity,

        "Metodo di pagamento":
          order.payment_method || "",

        "Stato pagamento":
          order.payment_status || "",

        "Quantità scatole":
          order.box_quantity || 0,

        "Costo scatole":
          Number(order.box_cost || 0),

        Note: order.notes || "",

        "Totale vendita":
          Number(order.total || 0),
      };
    });

    const detailRows: any[] = [];

    (orders || []).forEach((order: any) => {
      const date = new Date(order.order_date);

      (order.order_items || []).forEach(
        (item: any) => {
          detailRows.push({
            "ID Vendita": order.id,

            Data: new Intl.DateTimeFormat(
              "it-IT"
            ).format(date),

            Cliente:
              order.customer || "Vendita diretta",

            Prodotto: item.product_name,

            Variante: item.variant || "",

            Categoria:
              item.category || "",

            Quantità:
              Number(item.quantity),

            "Prezzo unitario":
              Number(item.unit_price),

            "Totale prodotto":
              Number(item.quantity) *
              Number(item.unit_price),

            Pagamento:
              order.payment_method || "",

            Stato:
              order.payment_status || "",
          });
        }
      );
    });

    const workbook = XLSX.utils.book_new();

    const salesSheet =
      XLSX.utils.json_to_sheet(salesRows);

    const detailSheet =
      XLSX.utils.json_to_sheet(detailRows);

    salesSheet["!cols"] = [
      { wch: 12 },
      { wch: 12 },
      { wch: 8 },
      { wch: 24 },
      { wch: 55 },
      { wch: 18 },
      { wch: 22 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 35 },
      { wch: 16 },
    ];

    detailSheet["!cols"] = [
      { wch: 12 },
      { wch: 12 },
      { wch: 24 },
      { wch: 20 },
      { wch: 12 },
      { wch: 14 },
      { wch: 10 },
      { wch: 16 },
      { wch: 18 },
      { wch: 20 },
      { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      salesSheet,
      "Vendite"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      detailSheet,
      "Dettaglio prodotti"
    );

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    const date = new Date()
      .toISOString()
      .slice(0, 10);

    return new NextResponse(buffer, {
      status: 200,

      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

        "Content-Disposition":
          `attachment; filename="Vendite_Monteromola_${date}.xlsx"`,
      },
    });
  } catch (error) {
    console.error(
      "Errore esportazione Excel:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Errore durante la generazione del file Excel.",
      },
      {
        status: 500,
      }
    );
  }
}