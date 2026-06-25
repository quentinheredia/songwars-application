import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Live Song War",
  description: "A 16-team live music single-elimination tournament.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
