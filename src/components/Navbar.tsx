"use client";

import Link from "next/link";
import { Search, Users, FileText, Mail, Folder, Vote, Plus } from "lucide-react";
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
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/'); // Redirect to login page after logout
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <header className="bg-indigo-700 text-white">
        <div className="container mx-auto px-4">
          {/* Top bar */}
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

          {/* Navigation */}
          <nav className="h-14 flex items-center space-x-8">
            <Link 
              href="/users" 
              className="flex items-center space-x-2 text-white/90 hover:text-white"
            >
              <Users className="h-5 w-5" />
              <span>Users</span>
            </Link>
            <Link 
              href="/feed" 
              className="flex items-center space-x-2 text-white/90 hover:text-white"
            >
              <FileText className="h-5 w-5" />
              <span>Feed</span>
            </Link>
            <Link 
              href="/news" 
              className="flex items-center space-x-2 text-white/90 hover:text-white"
            >
              <Mail className="h-5 w-5" />
              <span>News</span>
            </Link>
            <Link 
              href="/documents" 
              className="flex items-center space-x-2 text-white/90 hover:text-white"
            >
              <Folder className="h-5 w-5" />
              <span>Documents</span>
            </Link>
            <Link 
              href="/votes" 
              className="flex items-center space-x-2 text-white/90 hover:text-white"
            >
              <Vote className="h-5 w-5" />
              <span>Votes</span>
            </Link>
          </nav>
        </div>
      </header>

      
    </div>
  );
}