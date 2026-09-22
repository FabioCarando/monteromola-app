"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  id: number;
  product_id: string | null;
  product_name: string;
  variant: string | null;
  category: string | null;
  quantity: number;
  unit_price: number;
};

type Props = {
  orderId: number;
  orderItems: OrderItem[];
};

export default function DeleteOrderButton({
  orderId,
  orderItems,
}: Props) {
  const router = useRouter();

  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function deleteOrder() {
    if (deleting) return;

    const confirmed = window.confirm(
      "Vuoi davvero eliminare questa vendita? I prodotti verranno rimessi in magazzino."
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setErrorMessage("");

      /*
       * 1. VERIFICA ORDINE
       */

      const {
        data: existingOrder,
        error: orderError,
      } = await supabase
        .from("orders")
        .select("id")
        .eq("id", orderId)
        .single();

      if (orderError) {
        throw orderError;
      }

      if (!existingOrder) {
        throw new Error(
          "Vendita non trovata."
        );
      }

      /*
       * 2. RIPRISTINO MAGAZZINO
       *
       * Usiamo product_id.
       *
       * Esempio:
       * order_items -> giulio
       * inventory   -> giulio
       */

      for (const item of orderItems) {
        if (!item.product_id) {
          throw new Error(
            `Product ID mancante per ${item.product_name}.`
          );
        }

        const quantityToRestore =
          Number(item.quantity || 0);

        if (quantityToRestore <= 0) {
          continue;
        }

        /*
         * Recuperiamo la riga inventory
         * tramite PRODUCT_ID.
         */

        const {
          data: inventoryItem,
          error: inventoryReadError,
        } = await supabase
          .from("inventory")
          .select(
            "id, product_id, product_name, quantity"
          )
          .eq(
            "product_id",
            item.product_id
          )
          .single();

        if (inventoryReadError) {
          console.error(
            "Errore ricerca inventory:",
            inventoryReadError
          );

          throw new Error(
            `Prodotto "${item.product_name}" non trovato in magazzino.`
          );
        }

        /*
         * Quantità attuale.
         *
         * Nel tuo esempio:
         * Giulio = 138
         */

        const currentQuantity =
          Number(
            inventoryItem.quantity || 0
          );

        /*
         * Ripristiniamo la quantità
         * della vendita eliminata.
         *
         * Esempio:
         *
         * 138 + 1 = 139
         */

        const newQuantity =
          currentQuantity +
          quantityToRestore;

        /*
         * Aggiornamento inventory.
         */

        const {
          error: inventoryUpdateError,
        } = await supabase
          .from("inventory")
          .update({
            quantity: newQuantity,
          })
          .eq(
            "id",
            inventoryItem.id
          );

        if (inventoryUpdateError) {
          console.error(
            "Errore aggiornamento magazzino:",
            inventoryUpdateError
          );

          throw new Error(
            `Non riesco a ripristinare ${item.product_name} nel magazzino.`
          );
        }
      }

      /*
       * 3. ELIMINA ORDER_ITEMS
       */

      const {
        error: itemsDeleteError,
      } = await supabase
        .from("order_items")
        .delete()
        .eq(
          "order_id",
          orderId
        );

      if (itemsDeleteError) {
        console.error(
          "Errore eliminazione order_items:",
          itemsDeleteError
        );

        throw new Error(
          "Non riesco a eliminare i prodotti della vendita."
        );
      }

      /*
       * 4. ELIMINA ORDINE
       */

      const {
        error: orderDeleteError,
      } = await supabase
        .from("orders")
        .delete()
        .eq(
          "id",
          orderId
        );

      if (orderDeleteError) {
        console.error(
          "Errore eliminazione ordine:",
          orderDeleteError
        );

        throw new Error(
          "Non riesco a eliminare la vendita."
        );
      }

      /*
       * 5. REFRESH
       */

      router.refresh();

    } catch (error) {
      console.error(
        "Errore cancellazione vendita:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Non è stato possibile eliminare la vendita."
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
        className="flex w-full items-center justify-center gap-2 rounded-[17px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Trash2
          size={16}
          strokeWidth={1.8}
        />

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