import type { Metadata } from "next";
import "./globals.css";
import { StoreNavbar } from "@/components/layout/StoreNavbar";
import { StoreFooter } from "@/components/layout/StoreFooter";
import { CartDrawer } from "@/components/cart/CartDrawer";

import { SommelierChatWidget } from "@/components/chat/SommelierChatWidget";

export const metadata: Metadata = {
  title: "OmniCollector | E-Commerce Especializado en Videojuegos, Figuras & Coleccionables",
  description:
    "Tienda especializada de alta gama: Preventas japonesas con depósito parcial del 20%, bundles con inventario atómico y piezas certificadas por PSA con protección contra sobreventa.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#F7F7F5] text-[#1A1A1A] antialiased selection:bg-[#FF6B35] selection:text-white flex flex-col justify-between">
        <div className="flex-1 flex flex-col">
          <StoreNavbar />
          <CartDrawer />
          <main className="flex-1">{children}</main>
        </div>
        <SommelierChatWidget />
        <StoreFooter />
      </body>
    </html>
  );
}
