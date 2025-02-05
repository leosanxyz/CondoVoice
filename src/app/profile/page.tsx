'use client';

import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, Home, AlertTriangle, Camera, Loader2, Smile, Star } from 'lucide-react';
import { getAuth, updateProfile } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { storage, db } from '@/lib/firebaseConfig';
import dynamic from 'next/dynamic';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from "@/lib/utils";
import { LayoutGroup, motion } from "motion/react"
import TextRotate, { TextRotateRef } from "@/components/fancy/text-rotate"

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
  cardColor?: string;
}

// Replace the colorOptions array with the new colors
const colorOptions = [
  '#FF2C60', '#FE319B', '#EC33F7', '#9E4FFF', '#5946F8',
  '#0881FF', '#00A9EE', '#06B2FF', '#00BEC9', '#07BC7D',
  '#00CA48', '#6DCD04', '#F4B004', '#FF9803', '#FF6800',
  '#FF2A3A', '#D2B14F', '#CF894A', '#00346A', '#1A1A1A'
];

// Place these constants at the top of the file (outside the component)
const BUTTON_STATES = {
  CUSTOMIZE: "Customize",
  EDIT: "Edit\u00A0Information", // use a non-breaking space so it is not split
  DONE: "Done"
};

// Add these styles to maintain consistent height for inputs
const inputStyles = "min-h-[24px] h-[24px]"; // Fixed height for inputs
const textareaStyles = "min-h-[80px] h-[80px]"; // Fixed height for textarea

// Add this helper function at the top of the file
const getLighterColor = (hexColor: string) => {
  // Convert hex to RGB and make it lighter
  const r = Math.min(255, parseInt(hexColor.slice(1,3), 16) + 20);
  const g = Math.min(255, parseInt(hexColor.slice(3,5), 16) + 20);
  const b = Math.min(255, parseInt(hexColor.slice(5,7), 16) + 20);
  return `rgb(${r}, ${g}, ${b})`;
};

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
    cardColor: '#00BFFF',
  });

  // New state for card color customization
  const [selectedColor, setSelectedColor] = useState(userData.cardColor || "#00BFFF");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [shouldRenderColorPicker, setShouldRenderColorPicker] = useState(false);
  const [isPickerMuted, setIsPickerMuted] = useState(false);
  const [showingStar, setShowingStar] = useState<string | null>(null);

  // Add our new buttonState.
  const [buttonState, setButtonState] = useState(BUTTON_STATES.CUSTOMIZE);

  // Add ref for TextRotate
  const textRotateRef = useRef<TextRotateRef>(null);

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
            cardColor: data.cardColor || '#00BFFF',
          }));
          setSelectedColor(data.cardColor || '#00BFFF');
        } else {
          setUserData(prevData => ({
            ...prevData,
            name: currentUser.displayName || 'Anonymous',
            email: currentUser.email || '',
            avatar: currentUser.photoURL || '/placeholder.svg',
            cardColor: '#00BFFF',
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

  // Function to open the color picker with fade in
  const openColorPicker = () => {
    setShouldRenderColorPicker(true);
    requestAnimationFrame(() => {
      setShowColorPicker(true);
    });
  };

  // Function to close the color picker with fade out
  const closeColorPicker = () => {
    setShowColorPicker(false);
    setTimeout(() => {
      setShouldRenderColorPicker(false);
    }, 300);
  };

  // Update the click handler to trigger the animation
  const handleCustomizeButtonClick = async () => {
    if (buttonState === BUTTON_STATES.CUSTOMIZE) {
      openColorPicker();
      setIsPickerMuted(false);
      setButtonState(BUTTON_STATES.EDIT);
      textRotateRef.current?.next(); // Trigger animation
    } else if (buttonState === BUTTON_STATES.EDIT) {
      setIsPickerMuted(true);
      setIsEditing(true);
      setButtonState(BUTTON_STATES.DONE);
      textRotateRef.current?.next(); // Trigger animation
    } else {
      await handleSave();
      setIsEditing(false);
      setIsPickerMuted(false);
      setShowColorPicker(false);
      setShouldRenderColorPicker(false);
      setButtonState(BUTTON_STATES.CUSTOMIZE);
      textRotateRef.current?.next(); // Trigger animation
    }
  };

  // Update the handleColorClick function to check if editing
  const handleColorClick = async (color: string) => {
    if (isEditing) return; // Don't allow color changes while editing
    if (showingStar === color) return; // Don't re-trigger if same color
    
    setSelectedColor(color);
    setShowingStar(color);

    // Save the color to Firestore
    if (currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), {
          cardColor: color
        }, { merge: true });
        
        // Update local state
        setUserData(prev => ({
          ...prev,
          cardColor: color
        }));
      } catch (error) {
        console.error('Error saving color:', error);
      }
    }
  };

  // Update the styles for animations
  const styles = `
    @keyframes fadeOut {
      0% { opacity: 1; transform: scale(1.2); }
      100% { opacity: 0; transform: scale(0.8); }
    }
    @keyframes fadeIn {
      0% { opacity: 0; transform: scale(0.8); }
      100% { opacity: 1; transform: scale(1.2); }
    }
    .animate-fade-out {
      animation: fadeOut 0.3s ease-out forwards;
    }
    .animate-fade-in {
      animation: fadeIn 0.3s ease-in forwards;
    }
  `;

  return (
    <div className="container mx-auto px-4 py-1 md:py-8 pb-36 max-w-2xl">
      <style>{styles}</style>
      {/* Apply selectedColor as background color for the card */}
      <Card style={{ backgroundColor: selectedColor }} className="mt-2 md:mt-0">
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
          <div className="flex flex-col space-y-1">
            {isEditing ? (
              <Input
                id="name"
                name="name"
                value={userData.name}
                onChange={handleInputChange}
                className={`bg-transparent border-0 p-0 focus:ring-0 text-2xl font-bold text-white placeholder-white ${inputStyles}`}
              />
            ) : (
              <CardTitle className="text-2xl font-bold text-white h-[24px]">{userData.name}</CardTitle>
            )}
            <div className="flex items-center space-x-1">
              <Mail className="h-4 w-4 text-white" />
              <span className="text-sm text-white/90">{userData.email}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Phone className="h-4 w-4 text-white" />
              {isEditing ? (
                <Input
                  id="phone"
                  name="phone"
                  value={userData.phone}
                  onChange={handleInputChange}
                  className={`bg-transparent border-0 p-0 focus:ring-0 text-sm text-white placeholder-white ${inputStyles}`}
                />
              ) : (
                <span className="text-sm text-white/90 h-[24px]">{userData.phone}</span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Home className="h-4 w-4 text-white" />
              {isEditing ? (
                <Input
                  id="aptNumber"
                  name="aptNumber"
                  value={userData.aptNumber}
                  onChange={handleInputChange}
                  className={`bg-transparent border-0 p-0 focus:ring-0 text-sm text-white placeholder-white ${inputStyles}`}
                />
              ) : (
                <span className="text-sm text-white/90 h-[24px]">{userData.aptNumber}</span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <Separator className="my-6" />
              <div className="space-y-2">
                <Label htmlFor="emergencyContact" className="text-white">Emergency Info</Label>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-white" />
                  <Textarea
                    id="emergencyContact"
                    name="emergencyContact"
                    value={userData.emergencyContact}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`resize-none bg-transparent text-white placeholder-white border-white/20 focus:border-white ${textareaStyles}`}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <LayoutGroup>
            <motion.div layout>
              <Button 
                onClick={handleCustomizeButtonClick}
                className="hover:opacity-90 transition-opacity"
                style={{ 
                  backgroundColor: getLighterColor(selectedColor)
                }}
              >
                <TextRotate
                  ref={textRotateRef}
                  texts={[BUTTON_STATES.CUSTOMIZE, BUTTON_STATES.EDIT, BUTTON_STATES.DONE]}
                  mainClassName="px-2 overflow-hidden whitespace-nowrap text-white"
                  staggerFrom="last"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "-120%" }}
                  staggerDuration={0.025}
                  splitLevelClassName="overflow-hidden"
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                  splitBy="characters"
                  auto={false}
                  loop={true}
                />
              </Button>
            </motion.div>
          </LayoutGroup>
        </CardFooter>
      </Card>

      {/* Inline Color Picker below the card with fade transition */}
      {shouldRenderColorPicker && (
        <div className={`mt-4 p-4 bg-white border border-gray-200 rounded transition-opacity duration-300 ${showColorPicker ? "opacity-100" : "opacity-0"}`}> 
          <h2 className="text-xl font-bold mb-2">Select Card Color</h2>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-4">
            {colorOptions.map((color) => (
              <button
                key={color}
                className={`w-full pt-[100%] rounded-full relative transition-opacity ${
                  isPickerMuted ? 'opacity-30 cursor-not-allowed' : 'opacity-100 cursor-pointer'
                } ${selectedColor === color ? 'ring-4 ring-white' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorClick(color)}
              >
                {selectedColor === color && (
                  <div className={`absolute inset-0 flex items-center justify-center ${
                    showingStar === color ? 'animate-fade-in' : 'animate-fade-out'
                  }`}>
                    <Star className="w-6 h-6 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              className={`text-white hover:opacity-90 transition-opacity ${isPickerMuted ? 'opacity-30 cursor-not-allowed' : ''}`}
              style={{ backgroundColor: selectedColor }}
              onClick={() => { setIsEditing(true); closeColorPicker(); }}
              disabled={isPickerMuted}
            >
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
