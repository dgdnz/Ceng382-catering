import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pink Dessert Shop - Catering",
  description: "Delicious pasties and catering service for your sweet needs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
