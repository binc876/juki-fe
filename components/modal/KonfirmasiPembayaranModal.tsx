'use client'

import { X, Upload } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

type KonfirmasiPembayaranModalProps = {
    isOpen: boolean
    onClose: () => void
    onSubmit?: (file: File) => void
}

export default function KonfirmasiPembayaranModal({
    isOpen,
    onClose,
    onSubmit,
}: KonfirmasiPembayaranModalProps) {
    const [file, setFile] = useState<File | null>(null)

    if (!isOpen) return null

    const handleSubmit = () => {
        if (!file) return
        onSubmit?.(file)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/50">
            {/* FULLSCREEN MODAL */}
            <div className="relative w-full h-full bg-[#D4C4AF] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#5C7B78]">
                        Juki.Hub
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-md hover:bg-black/10 transition"
                        aria-label="Close modal"
                    >
                        <X className="w-6 h-6 text-[#5C7B78]" />
                    </button>
                </div>

                {/* CONTENT (CENTERED, TANPA WRAPPER) */}
                <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 md:px-20 lg:px-36">


                    <h2 className="text-3xl font-bold text-center text-[#5C7B78] mb-4">
                        Konfirmasi Pembayaran
                    </h2>
                    <h3 className="text-l font-bold text-center text-[#5C7B78] mb-4">Upload Bukti Pembayaran</h3>

                    <p className="text-sm text-center text-[#5C7B78]/80 mb-8">
                        Format gambar max 2mb
                    </p>

                    {/* Upload */}
                    <label
                        className="
              w-full
              flex flex-col items-center justify-center gap-3
              border-2 border-dashed border-[#5C7B78]
              rounded-xl p-10
              cursor-pointer
              hover:bg-[#5C7B78]/10
              transition
            "
                    >
                        <Upload className="w-10 h-10 text-[#5C7B78]" />

                        <span className="text-sm text-center text-[#5C7B78]">
                            {file ? file.name : 'Klik untuk upload bukti pembayaran'}
                        </span>

                        <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    setFile(e.target.files[0])
                                }
                            }}
                        />
                    </label>

                    {/* Submit */}
                    <Button
                        onClick={handleSubmit}
                        disabled={!file}
                        className="mt-10 bg-[#5C7B78] hover:bg-[#4e6a67] text-white font-semibold text-lg py-6 rounded-xl disabled:opacity-50"
                    >
                        Kirim
                    </Button>

                </div>
            </div>
        </div>
    )
}
