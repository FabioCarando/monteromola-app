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

  const [saving, setSaving] =
    useState(false);

  async function markAsPaid() {
    try {
      setSaving(true);

      const { error } = await supabase
        .from("orders")
        .update({
          payment_status: "Pagato",
        })
        .eq("id", orderId);

      if (error) {
        throw error;
      }

      /*
       * IMPORTANTISSIMO:
       * qui NON tocchiamo inventory.
       *
       * I prodotti sono già stati scaricati
       * quando la vendita è stata creata.
       */

      router.refresh();
    } catch (error) {
      console.error(error);
      alert(
        "Errore durante l'aggiornamento del pagamento."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={markAsPaid}
      disabled={saving}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-[17px] bg-[#657052] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
    >
      <Check size={16} />

      {saving
        ? "Aggiornamento..."
        : "Segna come pagato"}
    </button>
  );
}