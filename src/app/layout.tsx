import type { Metadata } from "next";
import "./globals.css";
import { SettingsProvider } from "@/components/SettingsProvider";

export const metadata: Metadata = {
  title: "Corner Mug",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  );
}
