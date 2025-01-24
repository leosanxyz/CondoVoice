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
        
        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/icons/icon-48x48.png" />
        
        {/* Apple specific */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167x167.png" />
        
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CondoVoice" />
        
        {/* Microsoft */}
        <meta name="msapplication-TileColor" content="#4338ca" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        
        {/* Safari */}
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#4338ca" />
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