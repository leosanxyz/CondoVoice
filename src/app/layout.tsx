import "@/styles/globals.css"; // o tu archivo global de Tailwind
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/auth-guard";
import Script from "next/script";

export const metadata = {
  title: "CondoVoice",
  description: "Aplicación de condominio con Next.js",
  manifest: "/manifest.json",
  themeColor: "#4338ca",
  appleWebAppCapable: "yes",
  appleWebAppStatusBarStyle: "default",
  appleWebAppTitle: "CondoVoice",
};

// Aquí tipamos las props del layout
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4338ca" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CondoVoice" />
      </head>
      <body className="font-sans">
        <AuthGuard>
          <Navbar />
          <main>{children}</main>
        </AuthGuard>
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}