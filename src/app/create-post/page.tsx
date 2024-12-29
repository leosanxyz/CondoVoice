"use client";

import React, { useState } from 'react';

export default function CreatePostPage() {
  const [title, setTitle] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Lógica para crear un post en Firestore
  }

  return (
    <div>
      <h1 className="text-xl mb-4">Crear nuevo post</h1>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3 max-w-md">
        <input
          type="text"
          value={title}
          placeholder="Título"
          className="border p-2"
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="bg-blue-500 text-white py-2 rounded">
          Publicar
        </button>
      </form>
    </div>
  );
}