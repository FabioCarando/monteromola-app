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

  const [deleting, setDeleting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const deleteOrder = async () => {
    if (deleting) return;

    const confirmed = window.confirm(
      "Vuoi davvero cancellare questa vendita? I prodotti verranno rimessi in magazzino."
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setErrorMessage("");

      /*
       * 1. Controlliamo che la vendita
       * esista ancora.
       */

      const {
        data: existingOrder,
        error: readError,
      } = await supabase
        .from("orders")
        .select("id, payment_status")
        .eq("id", orderId)
        .single();

      if (readError) {
        throw readError;
      }

      if (!existingOrder) {
        throw new Error(
          "Vendita non trovata."
        );
      }

      /*
       * 2. RIPRISTINO MAGAZZINO
       *
       * Recuperiamo ogni prodotto
       * nell'inventory e aggiungiamo
       * nuovamente la quantità venduta.
       */

      for (const item of orderItems) {
        const productName =
          item.product_name;

        const variant =
          item.variant || "";

        const quantityToRestore =
          Number(item.quantity || 0);

        if (
          !productName ||
          quantityToRestore <= 0
        ) {
          continue;
        }

        /*
         * Cerchiamo il prodotto
         * nell'inventory.
         */

        const {
          data: inventoryItem,
          error: inventoryReadError,
        } = await supabase
          .from("inventory")
          .select("*")
          .eq(
            "product_name",
            productName
          )
          .eq(
            "variant",
            variant
          )
          .maybeSingle();

        if (inventoryReadError) {
          console.error(
            "Errore lettura inventory:",
            inventoryReadError
          );

          throw new Error(
            `Errore durante il ripristino di ${productName}.`
          );
        }

        /*
         * Se non troviamo il prodotto,
         * blocchiamo l'eliminazione.
         *
         * Meglio non cancellare la vendita
         * piuttosto che perdere lo stock.
         */

        if (!inventoryItem) {
          throw new Error(
            `Prodotto "${productName}" non trovato in magazzino.`
          );
        }

        const currentQuantity =
          Number(
            inventoryItem.quantity || 0
          );

        const newQuantity =
          currentQuantity +
          quantityToRestore;

        /*
         * Aggiorniamo quella specifica
         * riga dell'inventory.
         */

        const {
          error: inventoryUpdateError,
        } = await supabase
          .from("inventory")
          .update({
            quantity: newQuantity,
          })
          .eq("id", inventoryItem.id);

        if (inventoryUpdateError) {
          console.error(
            "Errore aggiornamento inventory:",
            inventoryUpdateError
          );

          throw new Error(
            `Non riesco a ripristinare ${productName}.`
          );
        }
      }

      /*
       * 3. Eliminiamo gli order_items.
       *
       * Lo facciamo esplicitamente
       * prima dell'ordine.
       */

      const {
        error: itemsDeleteError,
      } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", orderId);

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
       * 4. Eliminiamo la vendita.
       */

      const {
        error: orderDeleteError,
      } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

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
       * 5. Aggiorniamo lo storico.
       */

      router.refresh();

    } catch (error) {
      console.error(
        "Errore cancellazione:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Non è stato possibile cancellare la vendita.";

      setErrorMessage(message);

    } finally {
      setDeleting(false);
    }
  };

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