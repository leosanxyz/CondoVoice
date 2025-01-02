'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Loader2 } from 'lucide-react';
import { getAuth, updateProfile } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebaseConfig';

export default function ProfilePage() {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const [name, setName] = useState(currentUser?.displayName || 'Anonymous');
  const [newName, setNewName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.photoURL || '/placeholder.svg');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value);
  };

  const handleNameUpdate = async () => {
    if (!newName.trim() || !currentUser) return;
    setIsUpdating(true);
    try {
      await updateProfile(currentUser, { displayName: newName.trim() });
      setName(newName.trim());
      setNewName('');
    } catch (error) {
      console.error('Error updating name:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setIsUpdating(true);
    const storageRef = ref(storage, `avatars/${currentUser?.uid}`);
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
          setAvatarUrl(downloadURL);
        } catch (error) {
          console.error('Error updating avatar URL:', error);
        } finally {
          setIsUpdating(false);
        }
      }
    );
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback>{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="relative">
              <Input
                type="file"
                id="avatar-upload"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
              />
              <Label
                htmlFor="avatar-upload"
                className="flex cursor-pointer items-center space-x-2 rounded-md border px-4 py-2 hover:bg-gray-100"
              >
                <Camera className="h-5 w-5" />
                <span>Change Picture</span>
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <div className="flex space-x-2">
              <Input
                id="name"
                value={newName}
                onChange={handleNameChange}
                placeholder={name}
              />
              <Button onClick={handleNameUpdate} disabled={!newName.trim() || isUpdating}>
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
              </Button>
            </div>
          </div>

          <div className="pt-4">
            <h3 className="text-lg font-semibold">Current Profile Information</h3>
            <p>Name: {name}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
