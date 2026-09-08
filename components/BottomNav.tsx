"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ReceiptText,
  Plus,
  Package,
} from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/[0.04] bg-[#FCFAF5]/90 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-md items-end justify-around px-5 pb-[calc(env(safe-area-inset-bottom)+9px)] pt-2">

        <Link
          href="/"
          className={`flex min-w-16 flex-col items-center gap-1.5 ${
            isActive("/") ? "text-[#6F2636]" : "text-[#9B968E]"
          }`}
        >
          <Home size={21} strokeWidth={1.8} />
          <span className="text-[10px] font-medium">
            Home
          </span>
        </Link>

        <Link
          href="/orders"
          className={`flex min-w-16 flex-col items-center gap-1.5 ${
            isActive("/orders")
              ? "text-[#6F2636]"
              : "text-[#9B968E]"
          }`}
        >
          <ReceiptText size={21} strokeWidth={1.8} />
          <span className="text-[10px] font-medium">
            Storico
          </span>
        </Link>

        <Link
          href="/sales/new"
          className="flex flex-col items-center gap-1"
        >
          <div className="-mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-[#6F2636] text-white shadow-[0_8px_30px_rgba(111,38,54,0.28)] transition active:scale-95">
            <Plus size={28} strokeWidth={2} />
          </div>

          <span className="text-[10px] font-semibold text-[#6F2636]">
            Vendita
          </span>
        </Link>

        <Link
          href="/inventory"
          className={`flex min-w-16 flex-col items-center gap-1.5 ${
            isActive("/inventory")
              ? "text-[#6F2636]"
              : "text-[#9B968E]"
          }`}
        >
          <Package size={21} strokeWidth={1.8} />
          <span className="text-[10px] font-medium">
            Stock
          </span>
        </Link>

      </div>
    </nav>
  );
}