import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Nord Aviation",
    template: "%s · Nord Aviation",
  },
  description:
    "Consulta e cadastro de aeronaves do Registro Aeronáutico Brasileiro (RAB/ANAC)",
  applicationName: "Nord Aviation",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nord Aviation",
  },
};

export const viewport: Viewport = {
  themeColor: "#0284c7",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="fundo-gradiente" aria-hidden />
        {children}
      </body>
      <ServiceWorkerRegister />
    </html>
  );
}
