"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { supabase } from "@/lib/supabase";

type OrderItem = {
  product_id: string | null;
  product_name: string;
  variant: string | null;
  quantity: number;
};

export default function DeletePendingOrderButton({
  orderId,
  orderItems,
}: {
  orderId: number;
  orderItems: OrderItem[];
}) {
  const router = useRouter();

  const [deleting, setDeleting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  async function deleteOrder() {
    if (deleting) return;

    const confirmed = window.confirm(
      "Vuoi eliminare questa vendita? I prodotti verranno rimessi in magazzino."
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setErrorMessage("");

      /*
       * 1. Controlliamo che l'ordine
       * sia ancora IN ATTESA.
       */

      const {
        data: order,
        error: orderError,
      } = await supabase
        .from("orders")
        .select("id, payment_status")
        .eq("id", orderId)
        .single();

      if (orderError || !order) {
        throw new Error(
          "Ordine non trovato."
        );
      }

      if (
        order.payment_status !==
        "In attesa di pagamento"
      ) {
        throw new Error(
          "Puoi eliminare da qui solo le vendite in attesa di pagamento."
        );
      }

      /*
       * 2. Ripristiniamo il magazzino.
       */

      for (const item of orderItems) {
        if (!item.product_id) continue;

        const {
          data: inventoryItem,
          error: inventoryError,
        } = await supabase
          .from("inventory")
          .select("quantity")
          .eq(
            "product_name",
            item.product_name
          )
          .eq(
            "variant",
            item.variant || ""
          )
          .maybeSingle();

        if (inventoryError) {
          throw inventoryError;
        }

        /*
         * Se il prodotto è presente
         * nell'inventory, restituiamo
         * la quantità.
         */

        if (inventoryItem) {
          const newQuantity =
            Number(
              inventoryItem.quantity || 0
            ) +
            Number(item.quantity || 0);

          const { error: updateError } =
            await supabase
              .from("inventory")
              .update({
                quantity: newQuantity,
              })
              .eq(
                "product_name",
                item.product_name
              )
              .eq(
                "variant",
                item.variant || ""
              );

          if (updateError) {
            throw updateError;
          }
        }
      }

      /*
       * 3. Eliminiamo gli order_items.
       */

      const {
        error: itemsDeleteError,
      } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", orderId);

      if (itemsDeleteError) {
        throw itemsDeleteError;
      }

      /*
       * 4. Eliminiamo l'ordine.
       */

      const {
        error: orderDeleteError,
      } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (orderDeleteError) {
        throw orderDeleteError;
      }

      /*
       * 5. Aggiorniamo lo Storico.
       */

      router.refresh();

    } catch (error) {
      console.error(
        "Errore eliminazione vendita:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Errore durante l'eliminazione."
      );

    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={deleteOrder}
        disabled={deleting}
        className="flex w-full items-center justify-center gap-2 rounded-[17px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition active:scale-[0.98] disabled:opacity-50"
      >
        <Trash2 size={16} />

        {deleting
          ? "Eliminazione..."
          : "Elimina vendita"}
      </button>

      {errorMessage && (
        <p className="mt-2 text-center text-xs font-medium text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
}