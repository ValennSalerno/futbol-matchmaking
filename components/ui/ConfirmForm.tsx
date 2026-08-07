"use client";

import { ReactNode } from "react";

interface ConfirmFormProps {
  action: (formData: FormData) => void;
  className?: string;
  children: ReactNode;
}

export default function ConfirmForm({
  action,
  className,
  children,
}: ConfirmFormProps) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(e) => {
        const confirmado = window.confirm(
          "🚨 ¿Estás seguro de confirmar este resultado?\n\nSe actualizarán las estadísticas, el historial y los winrates de todos los jugadores de forma permanente.",
        );

        if (!confirmado) {
          e.preventDefault(); // Detiene el envío hacia el servidor
        }
      }}
    >
      {children}
    </form>
  );
}
