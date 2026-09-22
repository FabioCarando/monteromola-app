"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

import { supabase } from "@/lib/supabase";

export default function MarkAsPaidButton({
  orderId,
}: {
  orderId: number;
}) {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function markAsPaid() {
    if (saving || completed) {
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("orders")
        .update({
          payment_status: "Pagato",
        })
        .eq("id", orderId)
        .select("id, payment_status")
        .single();

      if (error) {
        console.error(
          "Errore aggiornamento pagamento:",
          error
        );

        setErrorMessage(
          "Non riesco ad aggiornare il pagamento."
        );

        return;
      }

      if (
        !data ||
        data.payment_status !== "Pagato"
      ) {
        console.error(
          "Pagamento non aggiornato:",
          data
        );

        setErrorMessage(
          "Lo stato non è stato aggiornato."
        );

        return;
      }

      /*
       * IMPORTANTE:
       * NON tocchiamo inventory.
       *
       * Il magazzino è già stato scalato
       * quando la vendita è stata creata.
       */

      setCompleted(true);

      /*
       * Aggiorna i Server Components
       * della pagina /orders.
       */

      router.refresh();

    } catch (error) {
      console.error(
        "Errore pagamento:",
        error
      );

      setErrorMessage(
        "Si è verificato un errore."
      );

    } finally {
      setSaving(false);
    }
  }

  /*
   * Feedback immediato mentre
   * router.refresh() aggiorna la pagina.
   */

  if (completed) {
    return (
      <div className="flex w-full items-center justify-center gap-2 rounded-[17px] bg-[#606C38]/10 px-4 py-3 text-sm font-semibold text-[#606C38]">
        <Check size={16} />
        Pagato
      </div>
    );
  }

  return (
    <div>

      <button
        type="button"
        onClick={markAsPaid}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-[17px] bg-[#606C38] px-4 py-3 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Check size={16} />

        {saving
          ? "Aggiornamento..."
          : "Segna come pagato"}
      </button>

      {errorMessage && (
        <p className="mt-2 text-center text-xs font-medium text-red-600">
          {errorMessage}
        </p>
      )}

    </div>
  );
}