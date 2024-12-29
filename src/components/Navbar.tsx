"use client";

import Link from "next/link";
import { Search, Users, FileText, Mail, Folder, Vote, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Navbar() {
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
            <Avatar className="h-8 w-8 bg-pink-100">
              <AvatarFallback className="text-pink-500">L</AvatarFallback>
            </Avatar>
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
              href="/reports" 
              className="flex items-center space-x-2 text-white/90 hover:text-white"
            >
              <FileText className="h-5 w-5" />
              <span>Reports</span>
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