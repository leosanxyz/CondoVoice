import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function useInstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const ready = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      console.log('👋 BeforeInstallPromptEvent fired');
      setPrompt(e);
      setIsInstallable(true);
    };

    // Check if the app is already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('📱 App is already installed');
        setIsInstallable(false);
      }
    };

    checkInstalled();
    window.addEventListener('beforeinstallprompt', ready);
    window.addEventListener('appinstalled', () => {
      console.log('🎉 App was installed');
      setIsInstallable(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', ready);
    };
  }, []);

  const installApp = async () => {
    if (!prompt) {
      console.log('❌ No prompt available');
      return;
    }

    try {
      console.log('🚀 Triggering install prompt');
      await prompt.prompt();
      const choice = await prompt.userChoice;
      
      console.log(`👤 User ${choice.outcome} the installation`);
      if (choice.outcome === 'accepted') {
        setIsInstallable(false);
      }
    } catch (error) {
      console.error('❌ Error installing:', error);
    }
  };

  return { isInstallable, installApp };
} 