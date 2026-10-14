"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ReceiptText } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ReceiptStatusButton({
  orderId,
  receiptIssued,
}: {
  orderId: number;
  receiptIssued: boolean;
}) {
  const router = useRouter();
  const [issued, setIssued] = useState(receiptIssued);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const savingRef = useRef(false);

  async function toggleReceipt() {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setErrorMessage("");
    const nextIssued = !issued;

    try {
      const { data, error } = await supabase
        .from("orders")
        .update({ receipt_issued: nextIssued })
        .eq("id", orderId)
        .select("id, receipt_issued")
        .single();

      if (error) throw error;
      if (!data || data.receipt_issued !== nextIssued) {
        throw new Error("Stato scontrino non aggiornato.");
      }

      setIssued(nextIssued);
      router.refresh();
    } catch (error) {
      console.error("Errore aggiornamento scontrino:", error);
      setErrorMessage("Non riesco ad aggiornare lo scontrino. Riprova.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        role="switch"
        aria-checked={issued}
        aria-label={`Scontrino effettuato per vendita ${orderId}`}
        aria-busy={saving}
        disabled={saving}
        onClick={toggleReceipt}
        className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-[17px] px-4 py-3 text-left text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50 ${issued ? "bg-[#606C38]/10 text-[#606C38]" : "bg-[#C6924B]/15 text-[#9A682A]"}`}
      >
        <span className="flex items-center gap-2" aria-live="polite">
          <ReceiptText size={16} className="shrink-0" />
          {saving ? "Aggiornamento..." : issued ? "Scontrino fatto" : "Scontrino da fare"}
        </span>
        <span aria-hidden="true" className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 ${issued ? "justify-end bg-[#606C38]" : "justify-start bg-[#D9C9B3]"}`}>
          <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
        </span>
      </button>
      {errorMessage && <p role="alert" className="mt-2 text-xs font-medium text-red-600">{errorMessage}</p>}
    </div>
  );
}
