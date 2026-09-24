import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreNavbar } from "@/components/layout/StoreNavbar";
import { StoreFooter } from "@/components/layout/StoreFooter";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ScrollToTopButton } from "@/components/common/ScrollToTopButton";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { CookieConsentBanner } from "@/components/common/CookieConsentBanner";

import { SommelierChatWidget } from "@/components/chat/SommelierChatWidget";
import { SidePromotionalBanners } from "@/components/home/SidePromotionalBanners";
import { ToastContainer } from "@/components/common/ToastContainer";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1F3A5F",
};

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
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="min-h-screen bg-[#F7F7F5] text-[#1A1A1A] antialiased selection:bg-[#FF6B35] selection:text-white flex flex-col justify-between pb-14 sm:pb-0 overflow-x-hidden">
        <div className="flex-1 flex flex-col">
          <StoreNavbar />
          <CartDrawer />
          <main className="flex-1">{children}</main>
        </div>
        <SidePromotionalBanners />
        <SommelierChatWidget />
        <ScrollToTopButton />
        <MobileBottomNav />
        <CookieConsentBanner />
        <ToastContainer />
        <StoreFooter />
      </body>
    </html>
  );
}
