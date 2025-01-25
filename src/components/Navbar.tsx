"use client";

import Link from "next/link";
import { Users, FileText, Mail, Folder, Vote, Download } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  const [previousPath, setPreviousPath] = useState(pathname);

  useEffect(() => {
    setPreviousPath(pathname);
  }, [pathname]);

  const getSlideDirection = (current: string, previous: string) => {
    const currentIndex = navItems.findIndex(item => item.href === current);
    const previousIndex = navItems.findIndex(item => item.href === previous);
    
    if (currentIndex === -1 || previousIndex === -1) return 0;
    return currentIndex > previousIndex ? 1 : -1;
  };

  // Hide navbar on these routes
  const hiddenRoutes = ['/', '/register'];
  if (hiddenRoutes.includes(pathname)) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/'); // Redirect to login page after logout
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const NavLink = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
    const isActive = pathname === href;
    
    return (
      <Link href={href} className="relative">
        <motion.div
          className="flex flex-col items-center p-2 text-gray-600 hover:text-indigo-700"
          whileTap={{ scale: 0.9 }}
          animate={isActive ? { y: [0, -4, 0] } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Icon className={`h-6 w-6 ${isActive ? 'text-indigo-700' : ''}`} />
          <span className={`text-xs mt-1 ${isActive ? 'text-indigo-700 font-medium' : ''}`}>
            {label}
          </span>
          {isActive && (
            <motion.div
              className="absolute -bottom-2 left-0 right-0 h-0.5 bg-indigo-700"
              layoutId="activeTab"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </motion.div>
      </Link>
    );
  };

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
                    <Avatar className="h-8 w-8 bg-pink-100 cursor-pointer hover:opacity-90">
                      <AvatarFallback className="text-pink-500">L</AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Link href="/profile" className="flex items-center w-full">
                        Profile Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/notifications" className="flex items-center w-full">
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
        {/* Fixed Top Header */}
        <header className="fixed top-0 left-0 right-0 bg-indigo-700 text-white z-50">
          <div className="h-16 px-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
                <span className="text-indigo-700 font-bold">CV</span>
              </div>
              <span className="text-xl font-semibold">CondoVoice</span>
            </div>
            
            <div className="flex items-center space-x-3">
              {isInstallable && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={installApp}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Install</span>
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Avatar className="h-8 w-8 bg-pink-100 cursor-pointer hover:opacity-90">
                    <AvatarFallback className="text-pink-500">L</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link href="/profile" className="flex items-center w-full">
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/notifications" className="flex items-center w-full">
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
        </header>

        {/* Fixed Bottom Navigation */}
        <nav className="fixed bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-2xl shadow-lg z-50">
          <div className="flex justify-around items-center h-16">
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>
        </nav>

        {/* Content Padding */}
        <div className="pt-16 pb-24">
          {/* Increased bottom padding to prevent content from being hidden */}
        </div>
      </div>
    </>
  );
}
