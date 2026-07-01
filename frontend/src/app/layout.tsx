import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/app/context/AuthContext";
import Header from "../components/header/Header";
import Footer from "../components/footer";
import BottomNav from "../components/header/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CofradeNet",
  description: "Plataforma Integral de Gestión Cofrade",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} overflow-x-hidden`}>
        <Header />
        <AuthProvider>
          <div className="pb-16 md:pb-0">
            {children}
          </div>
        </AuthProvider>
        <div className="hidden md:block">
          <Footer />
        </div>
        <BottomNav />
      </body>
    </html>
  );
}