'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Home, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Resident {
  id: string;
  name: string;
  aptNumber: string;
  email: string;
  phone: string;
  avatar?: string;
}

export default function UserProfile() {
  const { id } = useParams();
  const [resident, setResident] = useState<Resident | null>(null);

  if (!id || typeof id !== 'string') {
    return <div className="container mx-auto px-4 py-8">Invalid user id</div>;
  }

  useEffect(() => {
    const fetchResident = async () => {
      const docRef = doc(db, 'users', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setResident({
          id,
          name: data.name || 'Anonymous',
          aptNumber: data.aptNumber || 'Not set',
          email: data.email || 'No email',
          phone: data.phone || 'No phone',
          avatar: data.avatar,
        });
      }
    };

    fetchResident();
  }, [id]);

  if (!resident) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <Card>
        <CardHeader className="flex flex-col items-center">
          <Avatar className="h-16 w-16">
            <AvatarImage src={resident.avatar || '/placeholder.svg'} />
            <AvatarFallback>{resident.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl font-bold mt-4">{resident.name}</CardTitle>
          <CardDescription>Apt {resident.aptNumber}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>{resident.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-5 w-5" />
              <span>{resident.phone}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Home className="h-5 w-5" />
              <span>Apt {resident.aptNumber}</span>
            </div>
            <div className="flex justify-end mt-4">
              <Link href="/users">
                <Button variant="outline">Back</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 