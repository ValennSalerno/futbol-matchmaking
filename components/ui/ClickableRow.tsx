"use client";

import { useRouter } from "next/navigation";
import { TableRow } from "@/components/ui/table";
import { ReactNode } from "react";

interface ClickableRowProps {
  nombreJugador: string;
  className: string;
  children: ReactNode;
}

export default function ClickableRow({
  nombreJugador,
  className,
  children,
}: ClickableRowProps) {
  const router = useRouter();

  return (
    <TableRow
      onClick={() => router.push(`/?jugador=${nombreJugador}`)}
      className={`${className} cursor-pointer`}
    >
      {children}
    </TableRow>
  );
}
