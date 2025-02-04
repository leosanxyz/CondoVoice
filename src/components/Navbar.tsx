"use client";

import Link from "next/link";
import { Users, FileText, Mail, Folder, Vote, Download, LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import { auth } from "@/lib/firebaseConfig";
import { signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/feed", icon: FileText, label: "Feed" },
  { href: "/users", icon: Users, label: "Users" },
  { href: "/documents", icon: Folder, label: "Docs" },
  { href: "/votes", icon: Vote, label: "Votes" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isInstallable, installApp } = useInstallPrompt();
  const [isNavigating, setIsNavigating] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState('');
  const [isEmojiAvatar, setIsEmojiAvatar] = useState(false);
  const [userColor, setUserColor] = useState('#00BFFF');
  const [prevPath, setPrevPath] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Get initial user data from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        
        // Set up real-time listener for user document
        const unsubscribeDoc = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            setUserAvatar(userData.avatar || user.photoURL || '/placeholder.svg');
            setIsEmojiAvatar(userData.isEmojiAvatar || false);
            setUserColor(userData.cardColor || '#00BFFF');
          } else {
            setUserAvatar(user.photoURL || '/placeholder.svg');
            setIsEmojiAvatar(false);
          }
          setUserInitials(
            user.displayName
              ? user.displayName.split(' ').map(n => n[0]).join('')
              : 'A'
          );
        });

        return () => {
          unsubscribeDoc();
        };
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Move the early return after all hooks
  // Hide navbar on these routes
  const hiddenRoutes = ['/', '/register'];
  if (hiddenRoutes.includes(pathname)) {
    return null;
  }

  const handleNavigation = (href: string) => {
    setIsNavigating(true);
    setPrevPath(pathname);
    router.push(href);
  };

  const NavLink = ({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) => {
    const isActive = !isNavigating && pathname === href;
    
    return (
      <button 
        onClick={() => handleNavigation(href)}
        className="relative w-full"
      >
        <motion.div
          className="flex flex-col items-center p-2"
          whileTap={{ scale: 0.9 }}
          animate={isActive ? { y: [0, -4, 0] } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Icon className={cn("h-6 w-6", isActive ? 'text-current' : 'text-gray-600')} style={isActive ? { color: userColor } : undefined} />
          <span className={cn("text-xs mt-1", isActive ? 'text-current font-medium' : '')} style={isActive ? { color: userColor } : undefined}>
            {label}
          </span>
        </motion.div>
      </button>
    );
  };

  const activeIndex = navItems.findIndex(item => item.href === pathname);
  const prevIndex = navItems.findIndex(item => item.href === prevPath);

  return (
    <>
      {/* Desktop Navigation - Hidden on mobile */}
      <div className="hidden md:flex md:flex-col w-full">
        <header className="bg-indigo-700 text-white">
          <div className="container mx-auto px-4">
            <div className="h-16 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
                  <span className="text-indigo-700 font-bold">CV</span>
                </div>
                <span className="text-xl font-semibold">CondoVoice</span>
              </div>
              
              <div className="flex items-center space-x-4">
                {isInstallable && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={installApp}
                    className="flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Install App</span>
                  </Button>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Avatar className={cn(
                      "h-8 w-8 cursor-pointer hover:opacity-90 overflow-visible",
                      isEmojiAvatar ? "bg-transparent border-0 !rounded-none" : "bg-pink-100"
                    )}>
                      <AvatarImage 
                        src={userAvatar || '/placeholder.svg'} 
                        className={cn(
                          "object-contain",
                          isEmojiAvatar && "transform scale-[1.2] !rounded-none"
                        )}
                      />
                      <AvatarFallback className="text-pink-500">{userInitials}</AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="w-full">
                        Profile Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/notifications" className="w-full">
                        Notifications
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={handleLogout}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <nav className="h-14 flex items-center space-x-8">
              <Link href="/users" className="flex items-center space-x-2 text-white/90 hover:text-white">
                <Users className="h-5 w-5" />
                <span>Users</span>
              </Link>
              <Link href="/feed" className="flex items-center space-x-2 text-white/90 hover:text-white">
                <FileText className="h-5 w-5" />
                <span>Feed</span>
              </Link>
              <Link href="/news" className="flex items-center space-x-2 text-white/90 hover:text-white">
                <Mail className="h-5 w-5" />
                <span>News</span>
              </Link>
              <Link href="/documents" className="flex items-center space-x-2 text-white/90 hover:text-white">
                <Folder className="h-5 w-5" />
                <span>Documents</span>
              </Link>
              <Link href="/votes" className="flex items-center space-x-2 text-white/90 hover:text-white">
                <Vote className="h-5 w-5" />
                <span>Votes</span>
              </Link>
            </nav>
          </div>
        </header>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        {/* Fixed Bottom Navigation - Moved higher up */}
        <nav className="fixed bottom-10 left-4 right-4 z-40 flex items-center space-x-4">
          {/* Avatar Button - Separate from main nav */}
          <div className="bg-white border border-gray-200 rounded-full shadow-lg h-20 flex items-center justify-center w-20 relative">
            {pathname === '/profile' && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ 
                  border: `2px solid ${userColor}`,
                  backgroundColor: 'transparent'
                }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center justify-center w-full h-full p-3">
                <Avatar className={cn(
                  "cursor-pointer hover:opacity-90",
                  isEmojiAvatar ? "w-auto h-auto bg-transparent border-0 overflow-visible" : "h-11 w-11 bg-pink-100"
                )}>
                  <AvatarImage 
                    src={userAvatar || '/placeholder.svg'} 
                    className={cn(
                      "object-contain w-auto h-auto",
                      isEmojiAvatar && "transform scale-[1.4] origin-center translate-x-1"
                    )}
                  />
                  <AvatarFallback className="text-pink-500 flex items-center justify-center">{userInitials}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="w-full">
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/notifications" className="w-full">
                    Notifications
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Main Navigation - With status bar on top */}
          <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-lg relative">
            {pathname !== '/profile' && (
              <motion.div
                key={activeIndex}
                className="absolute h-1 rounded-full"
                style={{ 
                  backgroundColor: userColor,
                  top: '8px',
                  width: '20%'
                }}
                initial={prevPath === '/profile' ? { 
                  left: `${(activeIndex * 25) + 2.5}%`,
                  scaleX: 0,
                  opacity: 0 
                } : {
                  left: `${(prevIndex * 25) + 2.5}%`,
                  scaleX: 1,
                  opacity: 1
                }}
                animate={{
                  left: `${(activeIndex * 25) + 2.5}%`,
                  scaleX: prevPath === '/profile' ? 1 : [1, 1.8, 0.6, 1],
                  opacity: 1
                }}
                transition={prevPath === '/profile' ? {
                  duration: 0.2,
                  ease: "easeOut"
                } : { 
                  duration: 0.4,
                  times: [0, 0.4, 0.8, 1],
                  ease: "easeInOut"
                }}
              />
            )}
            <div className="flex justify-around items-center h-20">
              {navItems.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>
          </div>
        </nav>

        {/* Reduced bottom padding since navbar is higher */}
        <div className="pb-32">
          {/* Bottom padding to prevent content from being hidden */}
        </div>
      </div>
    </>
  );
}
