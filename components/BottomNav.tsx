"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const items = [
    {
      label: "Home",
      href: "/",
      icon: "⌂",
    },
    {
      label: "Storico",
      href: "/orders",
      icon: "≡",
    },
    {
      label: "Vendita",
      href: "/sales/new",
      icon: "+",
      primary: true,
    },
    {
      label: "Magazzino",
      href: "/inventory",
      icon: "▦",
    },
  ];

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0
        z-50
        border-t border-black/5
        bg-[#FFFDF8]/95
        backdrop-blur-xl
      "
    >
      <div
        className="
          mx-auto flex max-w-md
          items-end justify-around
          px-3 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2
        "
      >
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          if (item.primary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className="
                    -mt-7 flex h-14 w-14
                    items-center justify-center
                    rounded-full
                    bg-[#722F37]
                    text-3xl text-white
                    shadow-lg
                  "
                >
                  +
                </div>

                <span className="text-[10px] font-medium text-[#722F37]">
                  Vendita
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-w-16 flex-col items-center gap-1"
            >
              <span
                className={`text-xl ${
                  active
                    ? "text-[#722F37]"
                    : "text-neutral-400"
                }`}
              >
                {item.icon}
              </span>

              <span
                className={`text-[10px] font-medium ${
                  active
                    ? "text-[#722F37]"
                    : "text-neutral-400"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}