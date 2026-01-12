'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Info, TriangleAlert } from 'lucide-react';

type AlertType = 'success' | 'error' | 'info' | 'warning';

interface AlertOptions {
  title?: string;
  message: string;
  type?: AlertType;
  onConfirm?: () => void;
}

interface AlertContextType {
  showAlert: (options: AlertOptions | string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<AlertOptions>({ message: '', type: 'info' });

  const showAlert = (options: AlertOptions | string) => {
    if (typeof options === 'string') {
      setConfig({ message: options, type: 'info', title: 'Informasi' });
    } else {
      setConfig({
        title: options.title || (options.type === 'error' ? 'Error' : options.type === 'success' ? 'Berhasil' : 'Informasi'),
        message: options.message,
        type: options.type || 'info',
        onConfirm: options.onConfirm
      });
    }
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (config.onConfirm) {
        config.onConfirm();
    }
  };

  // Listen for global custom events (for non-React files like api.tsx)
  useEffect(() => {
    const handleGlobalAlert = (event: CustomEvent) => {
       showAlert(event.detail);
    };

    window.addEventListener('global-alert', handleGlobalAlert as EventListener);
    return () => window.removeEventListener('global-alert', handleGlobalAlert as EventListener);
  }, []);

  // Icon helper
  const getIcon = () => {
      switch(config.type) {
          case 'success': return <CheckCircle className="w-14 h-14 text-[#5C7B78] mb-4" />;
          case 'error': return <AlertCircle className="w-14 h-14 text-[#D15651] mb-4" />;
          case 'warning': return <TriangleAlert className="w-14 h-14 text-[#D98E2E] mb-4" />;
          default: return <Info className="w-14 h-14 text-[#5C7B78] mb-4" />;
      }
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Dialog open={isOpen} onOpenChange={(open) => {
          if (!open) handleClose();
      }}>
        <DialogContent className="max-w-sm p-8 rounded-3xl bg-white text-center border-none shadow-2xl">
           <div className="flex flex-col items-center">
              {getIcon()}
              <DialogHeader>
                <DialogTitle className={`text-2xl font-bold mb-2 ${
                    config.type === 'error' ? 'text-[#D15651]' : 
                    config.type === 'warning' ? 'text-[#D98E2E]' : 
                    'text-[#5C7B78]'
                }`}>
                    {config.title}
                </DialogTitle>
                <DialogDescription className="text-gray-500 text-center text-base whitespace-pre-line leading-relaxed">
                    {config.message}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-8 w-full">
                 <Button 
                    onClick={handleClose} 
                    className={`w-full py-6 rounded-2xl font-bold text-lg text-white shadow-md transition-transform hover:scale-[1.02] ${
                        config.type === 'error' ? 'bg-[#D15651] hover:bg-[#b54641]' : 
                        config.type === 'warning' ? 'bg-[#D98E2E] hover:bg-[#b57b2b]' : 
                        'bg-[#5C7B78] hover:bg-[#4a6361]'
                    }`}
                 >
                    Oke, Saya Mengerti
                 </Button>
              </DialogFooter>
           </div>
        </DialogContent>
      </Dialog>
    </AlertContext.Provider>
  );
};
