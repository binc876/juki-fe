'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { isAxiosError } from 'axios'

import { UserTicket } from '@/lib/types';

interface SubmitJurnalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  activeTicket: UserTicket | null;
}

export default function SubmitJurnalModal({ isOpen, onClose, onSuccess, activeTicket }: SubmitJurnalModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isOpen) {
      console.log("[DEBUG] SubmitJurnalModal opened with props:", { isOpen });
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    console.log("[DEBUG] File selected:", selectedFile);
    if (!selectedFile) return;

    if (selectedFile.size > 2 * 1024 * 1024) {
      setError('Ukuran file maksimal 2 MB');
      setFile(null);
      return;
    }

    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Format file harus .pdf');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError('');
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Belum ada file yang diunggah');
      return;
    }
    if (!activeTicket?.id) {
      setError('ID Tiket Aktif tidak ditemukan!');
      return;
    }

    const formData = new FormData();
    formData.append('article', file);
    formData.append('user_ticket_id', String(activeTicket.id));

    console.log("[DEBUG] Submitting article with payload:", { 
      user_ticket_id: activeTicket.id, 
      article_name: file.name 
    });

    try {
      setLoading(true);
      setError('');

      const response = await api.post('/user-tickets/update-article', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log("[DEBUG] Submit Article API Success:", response.data);

      setNotification({ message: 'Artikel berhasil diunggah!', type: 'success' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (err: unknown) {
      if (isAxiosError(err)) {
        console.error("[DEBUG] Submit Article API Error:", err.response ? err.response.data : err);
        const errorMessage = err.response?.data?.message || 'Gagal mengunggah artikel';
        setError(errorMessage);
        setNotification({ message: errorMessage, type: 'error' });
      } else {
        console.error("[DEBUG] Submit Article API Error:", err);
        setError('Gagal mengunggah artikel');
        setNotification({ message: 'Gagal mengunggah artikel', type: 'error' });
      }
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setLoading(false);
    }
  }

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setError('');
      setLoading(false);
      setNotification(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !p-0 !m-0 !border-none !rounded-none !bg-[#D9C8B2] !overflow-hidden !z-50 !translate-x-0 !translate-y-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Upload Artikel</DialogTitle>

        {notification && (
          <div
            className={cn(
              "absolute top-8 left-1/2 -translate-x-1/2 p-4 rounded-md text-white z-[60]",
              notification.type === 'success' ? "bg-green-500" : "bg-red-500"
            )}
          >
            {notification.message}
          </div>
        )}

        <div className="absolute inset-0 w-full h-full flex flex-col">
          <div className="w-full flex justify-between items-center p-8">
            <span className="font-bold text-3xl text-[#5C7B78]">Jupalo.</span>
            <button
              onClick={onClose}
              className="text-[#5C7B78] hover:text-[#D15651] transition-colors p-1"
            >
              <X className="w-8 h-8 stroke-2" />
            </button>
          </div>

          <div className="flex-grow flex flex-col items-center justify-center text-center px-4">
            <h2 className="text-3xl font-bold text-[#5C7B78]">Upload Artikel.</h2>
            <p className="text-[#5C7B78] mt-1 mb-8">Format .pdf dengan ukuran maksimal 2 MB</p>

            <div className="space-y-4">
                <Button
                  onClick={() => document.getElementById('artikel-input')?.click()}
                  className="bg-transparent border border-[#5C7B78] text-[#5C7B78] hover:bg-[#5C7B78] hover:text-white py-2 px-12 rounded-lg font-normal text-lg transition-colors duration-200"
                  disabled={loading}
                >
                  Upload File
                </Button>
                
                <input
                  id="artikel-input"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={loading}
                />
                
                {file ? (
                  <p className="text-sm text-green-600 font-medium">
                    ✓ {file.name}
                  </p>
                ) : (
                  <p className="text-sm text-[#D15651] italic">
                    {error || 'Belum ada file yang di unggah'}
                  </p>
                )}
              </div>

              <Button
                onClick={handleSubmit}
                className={cn(
                  "bg-[#5C7B78] hover:bg-[#4a6562] text-white py-3 px-10 rounded-full font-bold text-lg transition-transform transform hover:scale-105 mt-8",
                  !file || loading ? 'opacity-50 cursor-not-allowed' : ''
                )}
                disabled={!file || loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Submit Artikel'
                )}
              </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
