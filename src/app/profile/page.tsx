'use client';

import { useState, useEffect, Suspense } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, Home, Car, Mail, Phone, PawPrint, AlertTriangle, Camera, Loader2, Smile } from 'lucide-react';
import { getAuth, updateProfile } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { storage, db } from '@/lib/firebaseConfig';
import dynamic from 'next/dynamic';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from "@/lib/utils";

// Preload emoji picker immediately
const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-2">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
    </div>
  ),
});

// Preload the emoji picker module
if (typeof window !== 'undefined') {
  const preloadEmojiPicker = () => {
    import('emoji-picker-react');
  };
  // Preload after a short delay to not block initial page load
  setTimeout(preloadEmojiPicker, 1000);
}

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
  isEmojiAvatar?: boolean;
}

export default function ProfilePage() {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    name: '',
    email: '',
    phone: '',
    aptNumber: '',
    residentSince: '',
    parkingSpot: '',
    petInfo: '',
    emergencyContact: '',
    avatar: '/placeholder.svg',
    isEmojiAvatar: false,
  });

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(prevData => ({
            ...prevData,
            ...data,
            name: currentUser.displayName || 'Anonymous',
            email: currentUser.email || '',
            avatar: data.avatar || currentUser.photoURL || '/placeholder.svg',
            isEmojiAvatar: data.isEmojiAvatar || false,
          }));
        } else {
          setUserData(prevData => ({
            ...prevData,
            name: currentUser.displayName || 'Anonymous',
            email: currentUser.email || '',
            avatar: currentUser.photoURL || '/placeholder.svg',
          }));
        }
      }
      setIsLoading(false);
    };
    loadUserData();
  }, [currentUser]);

  // Preload emoji picker when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('emoji-picker-react');
    }
  }, []);

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
          // Update Firebase Auth profile
          await updateProfile(currentUser, { photoURL: downloadURL });
          
          // Update Firestore document
          await setDoc(doc(db, 'users', currentUser.uid), {
            avatar: downloadURL,
            isEmojiAvatar: false
          }, { merge: true });
          
          // Update local state
          setUserData(prev => ({ 
            ...prev, 
            avatar: downloadURL,
            isEmojiAvatar: false 
          }));
        } catch (error) {
          console.error('Error updating avatar URL:', error);
        } finally {
          setIsUpdating(false);
        }
      }
    );
  };

  const handleEmojiSelect = async (emojiData: { emoji: string }) => {
    if (!currentUser) return;
    setIsUpdating(true);
    
    try {
      const emojiUrl = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><text y='24' font-size='24'>${emojiData.emoji}</text></svg>`;
      
      // Update Firebase Auth profile
      await updateProfile(currentUser, { photoURL: emojiUrl });
      
      // Update Firestore document
      await setDoc(doc(db, 'users', currentUser.uid), {
        avatar: emojiUrl,
        isEmojiAvatar: true
      }, { merge: true });
      
      // Update local state
      setUserData(prev => ({ 
        ...prev, 
        avatar: emojiUrl,
        isEmojiAvatar: true 
      }));
      
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error updating emoji avatar:', error);
    } finally {
      setIsUpdating(false);
    }
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
    <div className="container mx-auto px-4 py-1 md:py-8 pb-36 max-w-2xl">
      <Card className="mt-2 md:mt-0">
        <CardHeader className="flex flex-row items-center space-x-4 pb-2">
          <div className="relative">
            <Avatar className={cn(
              "h-16 w-16 overflow-visible transition-all duration-200",
              userData.isEmojiAvatar ? "bg-transparent border-0 !rounded-none" : undefined
            )}>
              <AvatarImage 
                src={userData.avatar} 
                className={cn(
                  "object-contain transition-all duration-200",
                  userData.isEmojiAvatar && "transform scale-[1.2] !rounded-none"
                )}
              />
              <AvatarFallback>{userData.name ? userData.name.split(' ').map(n => n[0]).join('') : ''}</AvatarFallback>
            </Avatar>
            {isEditing && (
              <div className="absolute -bottom-2 -right-2 flex space-x-1">
                <Label
                  htmlFor="avatar-upload"
                  className="rounded-full bg-primary p-1.5 text-white cursor-pointer hover:bg-primary/90"
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
                <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="default"
                      size="icon"
                      className="rounded-full h-[32px] w-[32px] p-1.5"
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="end">
                    <EmojiPicker
                      onEmojiClick={handleEmojiSelect}
                      width="100%"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
          <div className="flex flex-col space-y-1.5">
            <CardTitle className="text-2xl font-bold">{userData.name}</CardTitle>
            <CardDescription>Manage your CondoVoice profile information</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="personal">Personal Info</TabsTrigger>
                  <TabsTrigger value="residence">Residence Info</TabsTrigger>
                </TabsList>
                <TabsContent value="personal">
                  <div className="space-y-4">
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
            </>
          )}
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
