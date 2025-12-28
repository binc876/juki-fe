'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { format } from "date-fns"
import { id as localeID } from "date-fns/locale"
import { api } from "@/lib/api"
import { AxiosError } from 'axios';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Copy, Check } from "lucide-react";
import { UserTicket } from "@/lib/types";

function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError).isAxiosError !== undefined;
}

function Loader() {
  return (
    <div className="flex justify-center items-center h-full py-12 sm:py-16">
      <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 border-t-2 border-b-2 border-[#5C7B78]"></div>
    </div>
  )
}

interface PembayaranModalProps {
  isOpen: boolean;
  onClose: () => void;
  userTicketId: string | null;
}

export default function PembayaranModal({ isOpen, onClose, userTicketId }: PembayaranModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userTicket, setUserTicket] = useState<UserTicket | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Copy to clipboard function
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  useEffect(() => {
    if (!isOpen || !userTicketId) return;

    setLoading(true);
    setError(null);
    setUserTicket(null);
    setCopied(false);

    const initialFetch = async () => {
      try {
        const res = await api.get(`/user-tickets/${userTicketId}`)
        const userTicketData = res.data.data;
        setUserTicket(userTicketData);

        const status = userTicketData?.invoice?.status;
        if (status === "settlement" || status === "capture") {
          router.push(`/tiketku/pembayaran/sukses?order_id=${userTicketData.invoice.order_id}&user_ticket_id=${userTicketId}`);
        }
      } catch (err: unknown) {
        console.error("❌ Gagal mengambil data user-ticket (initial fetch):", err);
        if (isAxiosError(err) && err.response) {
            console.error("Response Data:", err.response.data);
            setError(`Gagal memuat data pembayaran (Status: ${err.response.status}).`);
        } else {
            setError("Gagal memuat data pembayaran. Periksa koneksi Anda.");
        }
      } finally {
        setLoading(false);
      }
    }

    initialFetch();

    const poll = async () => {
      try {
        const res = await api.get(`/user-tickets/${userTicketId}`)
        const status = res.data.data?.invoice?.status;
        if (status === "settlement" || status === "capture") {
          router.push(`/tiketku/pembayaran/sukses?order_id=${res.data.data.invoice.order_id}&user_ticket_id=${userTicketId}`);
        }
      } catch (err) {
        console.error("Polling failed:", err);
        if (isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
          clearInterval(interval);
        }
      }
    };

    const interval = setInterval(poll, 5000);

    return () => clearInterval(interval);
  }, [userTicketId, router, isOpen]);

  const invoice = userTicket?.invoice
  const vaInfo = invoice?.invoiceable

  const expiryDate = userTicket?.created_at
    ? format(new Date(new Date(userTicket.created_at).getTime() + 24 * 60 * 60 * 1000), "d MMMM yyyy 'pukul' HH:mm 'WIB'", {
        locale: localeID,
      })
    : null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="min-h-screen md:min-h-fit w-screen md:w-auto !max-w-2xl bg-[#909C90] border-none p-0 overflow-y-auto max-h-screen">
          <DialogTitle className="sr-only">Pembayaran</DialogTitle>
          <DialogDescription className="sr-only">Selesaikan pembayaran tiket Anda.</DialogDescription>
            <div className="bg-white p-4 sm:p-6 md:p-8 rounded-none md:rounded-2xl shadow-md text-[#5C7B78] my-auto">
                {loading ? (
                    <Loader />
                ) : error ? (
                    <div className="text-center p-6 sm:p-8 text-red-600 text-sm sm:text-base">
                      {error}
                    </div>
                ) : !userTicket ? (
                    <div className="text-center p-6 sm:p-8 text-sm sm:text-base">
                      Gagal memuat data tiket...
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-4 sm:mb-6 px-2">
                          Selesaikan Pembayaran
                        </h1>

                        {/* Total Payment */}
                        <div className="mb-6">
                          <p className="text-center text-base sm:text-lg font-semibold mb-1 sm:mb-2">
                            Total Pembayaran
                          </p>
                          <p className="text-center text-2xl sm:text-3xl md:text-4xl font-bold text-[#5C7B78] break-words px-2">
                            Rp {Number(invoice?.gross_amount).toLocaleString("id-ID")}
                          </p>
                        </div>

                        <hr className="my-4 sm:my-6" />

                        {/* Payment Info Section */}
                        <div className="flex flex-col lg:flex-row items-start gap-4 sm:gap-5 md:gap-6 mb-6">
                          {/* VA Card */}
                          <div className="bg-[#EEF0DC] border-2 border-[#5C7B78] rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 w-full lg:flex-1">
                            {/* Bank Logo & Name */}
                            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                              {vaInfo?.bank_code && (
                                <div className="flex-shrink-0">
                                  <Image
                                    src={`/bank-logos/${vaInfo.bank_code}.png`}
                                    alt={vaInfo.bank_code}
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 sm:w-10 sm:h-10"
                                    style={{ width: 'auto', height: 'auto' }}
                                  />
                                </div>
                              )}
                              <p className="font-bold text-sm sm:text-base md:text-md uppercase leading-tight">
                                {vaInfo?.bank_code} Virtual Account
                              </p>
                            </div>
                            
                            {/* VA Number Label */}
                            <p className="text-xs sm:text-sm text-[#5C7B78]/70 mb-1 sm:mb-2">
                              Nomor virtual akun
                            </p>
                            
                            {/* VA Number with Copy Button */}
                            <div className="flex items-center gap-2 bg-white rounded-lg p-2 sm:p-3 border border-[#5C7B78]/20">
                              <p className="font-bold text-base sm:text-lg md:text-xl tracking-wider break-all flex-1">
                                {vaInfo?.va_number}
                              </p>
                              <button
                                onClick={() => copyToClipboard(vaInfo?.va_number || '')}
                                className="flex-shrink-0 p-2 hover:bg-[#5C7B78]/10 rounded-md transition-colors active:scale-95"
                                aria-label="Copy virtual account number"
                              >
                                {copied ? (
                                  <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                                ) : (
                                  <Copy className="w-5 h-5 sm:w-6 sm:h-6 text-[#5C7B78]" />
                                )}
                              </button>
                            </div>
                            
                            {/* Copy Success Message */}
                            {copied && (
                              <p className="text-xs sm:text-sm text-green-600 mt-2 text-center font-medium">
                                ✓ Nomor berhasil disalin!
                              </p>
                            )}
                          </div>

                          {/* Instructions */}
                          <div className="w-full lg:flex-1 bg-gray-50 lg:bg-transparent rounded-lg lg:rounded-none p-3 sm:p-4 lg:p-0">
                            <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-3">
                              Cara Membayar?
                            </h3>
                            <ol className="list-decimal pl-4 sm:pl-5 space-y-1 sm:space-y-1.5 text-xs sm:text-sm leading-relaxed">
                              <li>Buka aplikasi mobile banking {vaInfo?.bank_code?.toUpperCase()}</li>
                              <li>Pilih menu Transfer {'>'} Virtual Account</li>
                              <li>Masukkan nomor virtual akun di atas</li>
                              <li>Pastikan nominal dan nama merchant sudah benar</li>
                              <li>Selesaikan pembayaran</li>
                            </ol>
                          </div>
                        </div>

                        {/* Expiry Notice */}
                        {expiryDate && (
                          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200">
                            <p className="text-center text-xs sm:text-sm md:text-base text-red-600 font-semibold leading-relaxed">
                              ⏰ Lakukan pembayaran sebelum: <br className="sm:hidden" />
                              <span className="inline-block mt-1 sm:mt-0">{expiryDate}</span>
                            </p>
                          </div>
                        )}
                    </>
                )}
            </div>
        </DialogContent>
    </Dialog>
  )
}