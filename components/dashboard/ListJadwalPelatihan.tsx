/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from "react"
// import { Card, CardContent} from "@/components/ui/card"
import { Calendar as CalendarIcon, MapPin, Users, Clock, User } from 'lucide-react'
import { Button } from "../ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { api } from "@/lib/api"
import dummyJadwalPelatihan from "@/lib/dummyJadwalPelatihan"
import { Card, CardContent } from "../ui/card"

export default function ListJadwalPelatihan() {
    const [listJadwalPelatihan, setListJadwalPelatihan] = useState<any[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 3

    const sortedJadwal = (listJadwalPelatihan || [])
        .slice()
        .sort((a, b) => {
            return new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
        })
        .filter((jadwal: any) => (jadwal.quota - jadwal.current_quota) > 0)

    // Hitung pagination
    const totalItems = sortedJadwal.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentItems = sortedJadwal.slice(startIndex, endIndex)

    const formatTanggalIndo = (tanggalString: string) => {
        const tanggal = new Date(tanggalString)
        return new Intl.DateTimeFormat('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(tanggal)
    }

    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1))
    }

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages))
    }

    const handlePageClick = (pageNumber: number) => {
        setCurrentPage(pageNumber)
    }

    // Function untuk generate array nomor halaman yang akan ditampilkan
    const getPageNumbers = () => {
        const pageNumbers: (number | string)[] = []

        if (totalPages <= 7) {
            // Jika total halaman <= 7, tampilkan semua
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i)
            }
        } else {
            // Selalu tampilkan halaman 1
            pageNumbers.push(1)

            if (currentPage <= 4) {
                // Jika current page di awal
                for (let i = 2; i <= 5; i++) {
                    pageNumbers.push(i)
                }
                pageNumbers.push('...')
                pageNumbers.push(totalPages)
            } else if (currentPage >= totalPages - 3) {
                // Jika current page di akhir
                pageNumbers.push('...')
                for (let i = totalPages - 4; i <= totalPages; i++) {
                    pageNumbers.push(i)
                }
            } else {
                // Jika current page di tengah
                pageNumbers.push('...')
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pageNumbers.push(i)
                }
                pageNumbers.push('...')
                pageNumbers.push(totalPages)
            }
        }

        return pageNumbers
    }

    // useEffect(() => {
    //     console.log("DEBUG: Attempting to fetch training schedules...");
    //     api.get('/training-schedules')
    //         .then(res => {
    //             console.log("DEBUG: API Response Received:", res);
    //             const schedules = res.data.data;
    //             console.log("DEBUG: Data being set to state:", schedules);
    //             setListJadwalPelatihan(schedules);
    //         })
    //         .catch(err => {
    //             console.log('❌ Gagal ambil jadwal', err)
    //         })
    // }, []);

    useEffect(() => {
        // simulasi fetch data
        setTimeout(() => {
            setListJadwalPelatihan(dummyJadwalPelatihan)
        }, 300)
    }, [])


    // Reset ke halaman 1 jika data berubah
    useEffect(() => {
        setCurrentPage(1)
    }, [listJadwalPelatihan])

    return (
        <div className="max-w-6xl mx-auto text-center space-y-6">
            {/* Container untuk cards */}
            <div className={`
                ${currentItems.length === 3 ? 'grid grid-cols-1 md:grid-cols-3 gap-6' : 'flex flex-wrap justify-center gap-6'}
            `}>
                {currentItems.map((jadwal: any) => (
                    <>
                        <div key={jadwal.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 overflow-hidden">
                            <div className="bg-gradient-to-r from-[#5C7B78] to-[#4e6a67] p-4 text-white">
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="w-5 h-5" />
                                    <div className="flex flex-col items-start">
                                        <span className="text-xs text-gray-300">{jadwal.batch_number} | {jadwal.subtitle}</span>
                                        <h2 className="text-lg font-bold">
                                            {(() => {
                                                const start = new Date(jadwal.started_at)
                                                const formattedDate = start.toLocaleDateString('id-ID', {
                                                    weekday: 'long',
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })
                                                return `${formattedDate}`
                                            })()}
                                        </h2>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="flex items-start gap-2 text-sm">
                                    <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700">{jadwal.location}</span>
                                </div>
                                {/* Mulai */}
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                    <span className="text-gray-700">
                                        {(() => {
                                            const start = new Date(jadwal.started_at)
                                            const end = new Date(jadwal.ended_at)
                                            const formattedTime = start.toLocaleTimeString('id-ID', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })
                                            const formattedEndTime = end.toLocaleTimeString('id-ID', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })
                                            return `${formattedTime} - ${formattedEndTime} WIB`
                                        })()}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 text-sm">
                                    <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                    <span className="text-gray-700">Dosbing:</span>
                                    <span className="font-semibold text-gray-700">{jadwal.lecturer}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                    <span className="text-gray-700">Sisa Kuota:</span>
                                    <span className="font-semibold text-red-700">{jadwal.quota - jadwal.current_quota} peserta</span>
                                </div>
                            </div>
                        </div></>
                ))}
            </div>

            {/* Pagination - New Design */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center mt-8 gap-2">
                    {/* Tombol Previous */}
                    <Button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                            ${currentPage === 1
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-[#5C7B78] text-white hover:bg-[#4a6562] shadow-md hover:shadow-lg border border-white'
                            }
                        `}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Prev
                    </Button>

                    {/* Nomor halaman */}
                    <div className="flex items-center gap-1">
                        {getPageNumbers().map((pageNumber, index) => {
                            if (pageNumber === '...') {
                                return (
                                    <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400 text-sm">
                                        •••
                                    </span>
                                )
                            }

                            const isActive = currentPage === pageNumber

                            return (
                                <Button
                                    key={pageNumber}
                                    onClick={() => handlePageClick(pageNumber as number)}
                                    className={`
                                        w-10 h-10 rounded-full p-0 text-sm font-medium transition-all duration-200
                                        ${isActive
                                            ? 'bg-[#5C7B78] text-white shadow-md border border-white'
                                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-[#5C7B78] hover:bg-opacity-10 hover:border-[#5C7B78]'
                                        }
                                    `}
                                >
                                    {pageNumber}
                                </Button>
                            )
                        })}
                    </div>

                    {/* Tombol Next */}
                    <Button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                            ${currentPage === totalPages
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-[#5C7B78] text-white hover:bg-[#4a6562] shadow-md hover:shadow-lg border border-white'
                            }
                        `}
                    >
                        Next
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* Info pagination */}
            {/* {totalItems > 0 && (
                <p className="text-sm text-gray-600 mt-4">
                    Menampilkan {startIndex + 1}-{Math.min(endIndex, totalItems)} dari {totalItems} jadwal
                </p>
            )} */}
        </div>
    )
}