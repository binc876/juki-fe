'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { isAxiosError } from 'axios'

import { UserTicket } from '@/lib/types';

interface UpdateSubmissionEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  activeTicket: UserTicket | null;
}

export default function UpdateSubmissionEvidenceModal({ isOpen, onClose, onSuccess, activeTicket }: UpdateSubmissionEvidenceModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isOpen) {
      console.log("[DEBUG] UpdateSubmissionEvidenceModal opened with props:", { isOpen });
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

    const allowedTypes = ['image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Format file harus .jpg atau .jpeg');
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
    if (!activeTicket?.user_ticket_detail?.id) {
      setError('ID Detail Tiket Pengguna tidak ditemukan!');
      return;
    }

    const formData = new FormData();
    // Sesuaikan dengan field name yang diharapkan server (dari curl example)
    formData.append('article_revision_evidence', file);
    // Tambahkan _method untuk Laravel method spoofing
    formData.append('_method', 'PUT');

    console.log("[DEBUG] Submitting submission evidence with payload:", { 
      user_ticket_detail_id: activeTicket.user_ticket_detail.id, 
      file_name: file.name,
      method: 'PUT'
    });

    try {
      setLoading(true);
      setError('');

      // Debug: Log FormData contents
      console.log("[DEBUG] FormData contents:");
      for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      // Gunakan POST dengan _method=PUT untuk Laravel method spoofing
      const response = await api.post(`/user-ticket-details/${activeTicket.user_ticket_detail.id}/update-submission-evidence`, formData, {
        headers: {
          // Jangan set Content-Type untuk multipart/form-data, biarkan browser yang mengatur boundary
          'Accept': 'application/json',
          // Pastikan Authorization header sudah ada di api instance
          // Jika tidak, tambahkan di sini atau di api interceptor
        },
      });

      console.log("[DEBUG] Update Submission Evidence API Success:", response.data);

      setNotification({ message: 'Bukti submit artikel berhasil diunggah!', type: 'success' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (err: unknown) {
      console.error("[DEBUG] Update Submission Evidence API Error:", err);
      
      // Enhanced error handling with detailed response logging
      let errorMessage = 'Gagal mengunggah bukti submit artikel';
      
      if (isAxiosError(err)) {
        // Log detailed error response
        console.log("[DEBUG] Error response status:", err.response?.status);
        console.log("[DEBUG] Error response data:", err.response?.data);
        console.log("[DEBUG] Error response headers:", err.response?.headers);
        
        if (err.response?.status === 405) {
          errorMessage = 'Method tidak diizinkan. Periksa konfigurasi endpoint.';
        } else if (err.response?.status === 401) {
          errorMessage = 'Tidak memiliki akses. Silakan login kembali.';
        } else if (err.response?.status === 422) {
          // Handle validation errors more specifically
          const responseData = err.response?.data;
          if (responseData?.errors) {
            // Laravel validation errors format
            const validationErrors = Object.values(responseData.errors).flat();
            errorMessage = validationErrors.join(', ');
          } else if (responseData?.message) {
            errorMessage = responseData.message;
          } else {
            errorMessage = 'Data tidak valid - periksa format dan ukuran file';
          }
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      }
      
      setError(errorMessage);
      setNotification({ message: errorMessage, type: 'error' });
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
        <DialogTitle className="sr-only">Upload Bukti Submit Artikel</DialogTitle>

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
            <h2 className="text-3xl font-bold text-[#5C7B78]">Upload Bukti Submit Artikel.</h2>
            <p className="text-[#5C7B78] mt-1 mb-8">Format .jpg atau .jpeg dengan ukuran maksimal 2 MB</p>

            <div className="space-y-4">
                <Button
                  onClick={() => document.getElementById('bukti-input')?.click()}
                  className="bg-transparent border border-[#5C7B78] text-[#5C7B78] hover:bg-[#5C7B78] hover:text-white py-2 px-12 rounded-lg font-normal text-lg transition-colors duration-200"
                  disabled={loading}
                >
                  Upload File
                </Button>
                
                <input
                  id="bukti-input"
                  type="file"
                  accept="image/jpeg,image/jpg"
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
                  'Submit Bukti'
                )}
              </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}