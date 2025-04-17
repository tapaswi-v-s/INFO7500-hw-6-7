import type { Metadata } from "next";
import { Header } from "~~/components/uniswap/Header";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Uniswap V2 UI",
  description: "A Uniswap V2 interface for Web3 assignments",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="relative flex flex-col flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}