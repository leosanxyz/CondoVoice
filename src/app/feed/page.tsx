"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

export default function FeedPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Si el usuario no está autenticado, lo mandamos al login
        router.push("/");
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <div className="p-4">Cargando...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl">¡Bienvenido al Feed!</h1>
      {/* Aquí irían tus posts, componentes, etc. */}
    </div>
  );
}