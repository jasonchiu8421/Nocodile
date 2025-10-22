import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ProjectProvider } from "@/contexts/ProjectContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nocodile",
  description: "Object identifier",
};

const Logo = () => {
  return (
    <img
      //className="fixed"
      src="/templogo.png"
      alt="logo"
      style={{ opacity: 0.2 }}
    />
  );
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dotted-grid`}
      >
        <ProjectProvider>
          <Logo />
          <main>{children}</main>
        </ProjectProvider>
      </body>
    </html>
  );
}
