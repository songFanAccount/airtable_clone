import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { ToastContainer } from 'react-toastify';
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "Lyra Airtable",
  description: "Lyra Airtable",
  icons: [{ rel: "icon", url: "/assets/airtable.svg" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <SessionProvider>
          <TRPCReactProvider>
            {children}
          </TRPCReactProvider>
          <ToastContainer
            position="bottom-right"
            theme="dark"
          />
        </SessionProvider>
      </body>
    </html>
  );
}
