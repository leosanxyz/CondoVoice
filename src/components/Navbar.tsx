"use client";

import Link from "next/link";
import { Users, FileText, Mail, Folder, Vote } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

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
        </header>

        {/* Fixed Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="flex justify-around items-center h-16">
            <Link href="/feed" className="flex flex-col items-center p-2 text-gray-600 hover:text-indigo-700">
              <FileText className="h-6 w-6" />
              <span className="text-xs mt-1">Feed</span>
            </Link>
            <Link href="/users" className="flex flex-col items-center p-2 text-gray-600 hover:text-indigo-700">
              <Users className="h-6 w-6" />
              <span className="text-xs mt-1">Users</span>
            </Link>
            <Link href="/documents" className="flex flex-col items-center p-2 text-gray-600 hover:text-indigo-700">
              <Folder className="h-6 w-6" />
              <span className="text-xs mt-1">Docs</span>
            </Link>
            <Link href="/votes" className="flex flex-col items-center p-2 text-gray-600 hover:text-indigo-700">
              <Vote className="h-6 w-6" />
              <span className="text-xs mt-1">Votes</span>
            </Link>
          </div>
        </nav>

        {/* Content Padding */}
        <div className="pt-16 pb-16">
          {/* This ensures content doesn't get hidden under fixed headers */}
        </div>
      </div>
    </>
  );
}
