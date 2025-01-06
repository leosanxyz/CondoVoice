"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    try {
      // Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update the user's display name
      await updateProfile(user, { displayName: name });

      // Create the user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: name,
        email: email,
        aptNumber: '',
        phone: '',
        residentSince: '',
        parkingSpot: '',
        petInfo: '',
        emergencyContact: '',
      });

      alert("¡Usuario registrado!");
      router.push("/"); // vuelve al login o directo a /feed, tú decides
    } catch (error: any) {
      console.error(error);
      alert("Error al registrarse");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl mb-4">Registro de usuario</h1>
      <form onSubmit={handleRegister} className="w-full max-w-sm flex flex-col space-y-3">
        <input
          type="text"
          placeholder="Nombre completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <button className="bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
          Crear Cuenta
        </button>
      </form>
    </div>
  );
}