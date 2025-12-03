import type { Metadata } from "next";
import { Barlow } from "next/font/google";
import "./globals.scss";
import RootProviders from "@/components/RootProviders";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";
//import { wagmiConfig } from "@/config/wagmi.config";
import { Toaster } from "react-hot-toast";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Dexa Pay",
  description: "Decentralized payment platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const initialState = cookieToInitialState(
  //   wagmiConfig,
  //   headers().get("cookie")
  // );
  return (
    <html lang="en" className="overflow-hidden">
      <body className={`${barlow.className}`}>
        <RootProviders>{children}</RootProviders>
        <Toaster />
      </body>
    </html>
  );
}
