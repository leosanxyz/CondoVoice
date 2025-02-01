'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, Mail, Phone } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { Button } from "@/components/ui/button";

interface Resident {
  id: string;
  name: string;
  aptNumber: string;
  email: string;
  phone: string;
  avatar?: string;
}

export default function DirectoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [residents, setResidents] = useState<Resident[]>([]);

  useEffect(() => {
    const fetchResidents = async () => {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      const residentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || 'Anonymous',
        aptNumber: doc.data().aptNumber || 'Not set',
        email: doc.data().email || 'No email',
        phone: doc.data().phone || 'No phone',
        avatar: doc.data().avatar,
      }));

      setResidents(residentsData);
    };

    fetchResidents();
  }, []);

  const filteredAndSortedResidents = residents
    .filter(resident => 
      resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.aptNumber.includes(searchTerm)
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'aptNumber') {
        return a.aptNumber.localeCompare(b.aptNumber);
      }
      return 0;
    });

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Resident Directory</CardTitle>
          <CardDescription>Find and connect with your neighbors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <div className="flex-grow">
                <Label htmlFor="search" className="sr-only">Search</Label>
                <Input
                  id="search"
                  placeholder="Search by name or apartment number"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-40">
                <Label htmlFor="sort" className="sr-only">Sort by</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger id="sort">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="aptNumber">Apartment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4">
                {filteredAndSortedResidents.map((resident) => (
                  <Card key={resident.id}>
                    <CardContent className="flex items-center space-x-4 p-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={resident.avatar || `/placeholder.svg`} />
                        <AvatarFallback>{resident.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-grow">
                        <h3 className="text-lg font-semibold">{resident.name}</h3>
                        <div className="flex flex-col space-y-1 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Home className="h-4 w-4 mr-2" />
                            Apt {resident.aptNumber}
                          </div>
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2" />
                            {resident.email}
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            {resident.phone}
                          </div>
                        </div>
                        <div className="flex justify-end mt-2 space-x-2">
                          <a href={`https://api.whatsapp.com/send?phone=${resident.phone}`} target="_blank" rel="noopener noreferrer">
                            <Button className="bg-green-500 text-white">WhatsApp</Button>
                          </a>
                          <a href={`/users/${resident.id}`}>
                            <Button variant="outline">View Profile</Button>
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 