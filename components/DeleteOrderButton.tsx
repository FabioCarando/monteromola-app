"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  orderId: number;
};

export default function DeleteOrderButton({ orderId }: Props) {
  const router = useRouter();

  const [deleting, setDeleting] = useState(false);

  const deleteOrder = async () => {
    const confirmed = window.confirm(
      "Vuoi davvero cancellare questa vendita?"
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (error) {
        throw error;
      }

      router.refresh();
    } catch (error) {
      console.error("Errore cancellazione:", error);

      alert(
        "Non è stato possibile cancellare la vendita."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={deleteOrder}
      disabled={deleting}
      className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition active:scale-95 disabled:opacity-40"
    >
      <Trash2 size={14} strokeWidth={1.8} />

      {deleting ? "Elimino..." : "Elimina"}
    </button>
  );
}