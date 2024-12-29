"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  // Si el usuario ya está logueado, redirige directamente a /feed
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/feed");
      }
    });
    return () => unsubscribe();
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Al iniciar sesión con éxito, onAuthStateChanged te llevará a /feed
    } catch (error: any) {
      console.error(error);
      alert("Error al iniciar sesión");
    }
  }

  function goToRegister() {
    router.push("/register");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl mb-4">Bienvenido a CondoVoice</h1>
      <form onSubmit={handleLogin} className="w-full max-w-sm flex flex-col space-y-3">
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded"
        />
        <button className="bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
          Iniciar Sesión
        </button>
        <p className="text-sm text-center">
          ¿No tienes cuenta?{" "}
          <button
            type="button"
            onClick={goToRegister}
            className="underline text-indigo-600 hover:text-indigo-800"
          >
            Regístrate aquí
          </button>
        </p>
      </form>
    </div>
  );
}