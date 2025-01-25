"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Home, Car, Mail, Phone, PawPrint, AlertTriangle } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";

interface FirebaseError {
  code: string;
  message: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  aptNumber: string;
  residentSince: string;
  parkingSpot: string;
  petInfo: string;
  emergencyContact: string;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterData>({
    name: "",
    email: "",
    password: "",
    phone: "",
    aptNumber: "",
    residentSince: "",
    parkingSpot: "",
    petInfo: "",
    emergencyContact: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Update the user's display name
      await updateProfile(user, { displayName: formData.name });

      // Create the user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        aptNumber: formData.aptNumber,
        residentSince: formData.residentSince,
        parkingSpot: formData.parkingSpot,
        petInfo: formData.petInfo,
        emergencyContact: formData.emergencyContact,
      });

      router.push("/");
    } catch (error: unknown) {
      console.error(error);
      const firebaseError = error as FirebaseError;
      alert("Error al registrarse: " + firebaseError.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Registro de usuario</CardTitle>
            <CardDescription>
              Completa tu información para crear una cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister}>
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="personal">Información Personal</TabsTrigger>
                  <TabsTrigger value="residence">Información de Residencia</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre completo</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Contraseña</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="residence" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="aptNumber">Número de Apartamento</Label>
                      <div className="flex items-center space-x-2">
                        <Home className="h-4 w-4 text-gray-500" />
                        <Input
                          id="aptNumber"
                          name="aptNumber"
                          value={formData.aptNumber}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="residentSince">Residente desde</Label>
                      <div className="flex items-center space-x-2">
                        <CalendarDays className="h-4 w-4 text-gray-500" />
                        <Input
                          id="residentSince"
                          name="residentSince"
                          type="date"
                          value={formData.residentSince}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="parkingSpot">Lugar de Estacionamiento</Label>
                      <div className="flex items-center space-x-2">
                        <Car className="h-4 w-4 text-gray-500" />
                        <Input
                          id="parkingSpot"
                          name="parkingSpot"
                          value={formData.parkingSpot}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="petInfo">Información de Mascotas</Label>
                      <div className="flex items-center space-x-2">
                        <PawPrint className="h-4 w-4 text-gray-500" />
                        <Input
                          id="petInfo"
                          name="petInfo"
                          value={formData.petInfo}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact">Contacto de Emergencia</Label>
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-gray-500" />
                        <Textarea
                          id="emergencyContact"
                          name="emergencyContact"
                          value={formData.emergencyContact}
                          onChange={handleInputChange}
                          className="resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6 space-y-4">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Creando cuenta..." : "Crear cuenta"}
                </Button>
                <div className="text-center text-sm">
                  ¿Ya tienes una cuenta?{" "}
                  <a 
                    href="/" 
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    Iniciar sesión
                  </a>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}