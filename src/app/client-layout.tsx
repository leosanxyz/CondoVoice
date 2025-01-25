"use client";

import "@/styles/globals.css";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/auth-guard";
import Script from "next/script";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navItems = [
  "/feed",
  "/users",
  "/documents",
  "/votes",
];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [previousPath, setPreviousPath] = useState(pathname);

  useEffect(() => {
    setPreviousPath(pathname);
  }, [pathname]);

  const getSlideDirection = () => {
    const currentIndex = navItems.indexOf(pathname);
    const previousIndex = navItems.indexOf(previousPath);
    
    if (currentIndex === -1 || previousIndex === -1) return 0;
    return currentIndex > previousIndex ? 100 : -100;
  };

  return (
    <>
      <AuthGuard>
        <Navbar />
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={pathname}
            initial={{ opacity: 0, x: getSlideDirection() }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -getSlideDirection() }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="overflow-hidden"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </AuthGuard>
      <Script
        id="register-sw"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `,
        }}
      />
    </>
  );
} 