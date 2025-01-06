'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, Home, Car, Mail, Phone, PawPrint, AlertTriangle, Camera, Loader2 } from 'lucide-react';
import { getAuth, updateProfile } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { storage, db } from '@/lib/firebaseConfig';

interface UserData {
  name: string;
  email: string;
  phone: string;
  aptNumber: string;
  residentSince: string;
  parkingSpot: string;
  petInfo: string;
  emergencyContact: string;
  avatar: string;
}

export default function ProfilePage() {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    name: currentUser?.displayName || 'Anonymous',
    email: currentUser?.email || '',
    phone: '',
    aptNumber: '',
    residentSince: '',
    parkingSpot: '',
    petInfo: '',
    emergencyContact: '',
    avatar: currentUser?.photoURL || '/placeholder.svg',
  });

  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(prevData => ({
            ...prevData,
            ...data,
            name: currentUser.displayName || 'Anonymous',
            email: currentUser.email || '',
            avatar: currentUser.photoURL || '/placeholder.svg',
          }));
        }
      }
    };
    loadUserData();
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setIsUpdating(true);
    const storageRef = ref(storage, `avatars/${currentUser.uid}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      null,
      (error) => {
        console.error('Error uploading avatar:', error);
        setIsUpdating(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        try {
          await updateProfile(currentUser, { photoURL: downloadURL });
          setUserData(prev => ({ ...prev, avatar: downloadURL }));
        } catch (error) {
          console.error('Error updating avatar URL:', error);
        } finally {
          setIsUpdating(false);
        }
      }
    );
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setIsUpdating(true);
    
    try {
      // Update display name in Firebase Auth
      await updateProfile(currentUser, { displayName: userData.name });

      // Update user data in Firestore
      await setDoc(doc(db, 'users', currentUser.uid), {
        name: userData.name,
        phone: userData.phone,
        aptNumber: userData.aptNumber,
        residentSince: userData.residentSince,
        parkingSpot: userData.parkingSpot,
        petInfo: userData.petInfo,
        emergencyContact: userData.emergencyContact,
      }, { merge: true });

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex flex-col space-y-1.5">
            <CardTitle className="text-2xl font-bold">Profile</CardTitle>
            <CardDescription>Manage your CondoVoice profile information</CardDescription>
          </div>
          <div className="relative">
            <Avatar className="h-16 w-16">
              <AvatarImage src={userData.avatar} />
              <AvatarFallback>{userData.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            {isEditing && (
              <Label
                htmlFor="avatar-upload"
                className="absolute -bottom-2 -right-2 rounded-full bg-primary p-1.5 text-white cursor-pointer hover:bg-primary/90"
              >
                <Camera className="h-4 w-4" />
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </Label>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="residence">Residence Info</TabsTrigger>
            </TabsList>
            <TabsContent value="personal">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={userData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
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
                      value={userData.email}
                      disabled={true}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={userData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="residence">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aptNumber">Apartment Number</Label>
                  <div className="flex items-center space-x-2">
                    <Home className="h-4 w-4 text-gray-500" />
                    <Input
                      id="aptNumber"
                      name="aptNumber"
                      value={userData.aptNumber}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="residentSince">Resident Since</Label>
                  <div className="flex items-center space-x-2">
                    <CalendarDays className="h-4 w-4 text-gray-500" />
                    <Input
                      id="residentSince"
                      name="residentSince"
                      type="date"
                      value={userData.residentSince}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parkingSpot">Parking Spot</Label>
                  <div className="flex items-center space-x-2">
                    <Car className="h-4 w-4 text-gray-500" />
                    <Input
                      id="parkingSpot"
                      name="parkingSpot"
                      value={userData.parkingSpot}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="petInfo">Pet Information</Label>
                  <div className="flex items-center space-x-2">
                    <PawPrint className="h-4 w-4 text-gray-500" />
                    <Input
                      id="petInfo"
                      name="petInfo"
                      value={userData.petInfo}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <Separator className="my-6" />
          <div className="space-y-2">
            <Label htmlFor="emergencyContact">Emergency Contact</Label>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-gray-500" />
              <Textarea
                id="emergencyContact"
                name="emergencyContact"
                value={userData.emergencyContact}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="resize-none"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isUpdating}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
