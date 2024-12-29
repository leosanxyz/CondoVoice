import "@/styles/globals.css"; // o tu archivo global de Tailwind
import Navbar from "@/components/Navbar";

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
        {/* Renderiza el Navbar en todas las páginas */}
        <Navbar />
        
        {/* Contenido específico de cada página (app/page.tsx, etc.) */}
        <main>{children}</main>
      </body>
    </html>
  );
}