import "@/styles/globals.css"; // o tu archivo global de Tailwind
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/auth-guard";

export const metadata = {
  title: "CondoVoice",
  description: "Aplicación de condominio con Next.js",
};

// Aquí tipamos las props del layout
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthGuard>
          <Navbar />
          <main>{children}</main>
        </AuthGuard>
      </body>
    </html>
  );
}