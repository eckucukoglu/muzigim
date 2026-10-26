import type { Metadata } from "next";
import "./globals.css";
import { PianoProvider } from "@/context/PianoContext";

export const metadata: Metadata = {
  title: "Roland FP-10 Müzik Akademisi & Maestro AI Öğretmen",
  description:
    "Roland FP-10 dijital piyano için USB-MIDI destekli, sıfırdan müzik teorisi, kulak eğitimi, doğaçlama ve canlı yapay zeka piyano öğretmeni uygulaması.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="dark">
      <body className="antialiased selection:bg-amber-500 selection:text-slate-950">
        <PianoProvider>{children}</PianoProvider>
      </body>
    </html>
  );
}
