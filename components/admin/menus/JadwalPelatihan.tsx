/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Plus, Calendar as CalendarIcon, MapPin, Users, Clock, Download, X, CheckCircle, XCircle, AlertCircle, Eye, Search, Copy } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@radix-ui/react-select'

interface TicketData {
    id: number;
    title: string;
    description: string;
    price: number;
    created_at: string;
    updated_at: string;
}

interface PaymentInfo {
    biaya: string;
    nomor_rekening: string;
    nama_pemilik: string;
}

interface FormAdminInfo {
    link: string;
}

export default function JadwalPelatihan() {
    const [jadwalPelatihan, setJadwalPelatihan] = useState({
        batch_number: '',
        started_at: '',
        ended_at: '',
        subtitle: '',
        location: '',
        quota: '',
        lecturer: '',
    });
    const [listJadwalPelatihan, setListJadwalPelatihan] = useState<any[]>([])
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [selectedJadwal, setSelectedJadwal] = useState<any>(null)
    const [participants, setParticipants] = useState<any[]>([])
    const [isLoadingParticipants, setIsLoadingParticipants] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Payment Info States
    const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
        biaya: '150000',
        nomor_rekening: '123456789011',
        nama_pemilik: 'Jurnal Ekonomi Pembangunan'
    })
    const [isEditPaymentOpen, setIsEditPaymentOpen] = useState(false)
    const [tempPaymentInfo, setTempPaymentInfo] = useState<PaymentInfo>(paymentInfo)

    // Form Admin Link States
    const [formAdminInfo, setFormAdminInfo] = useState<FormAdminInfo>({
        link: 'https://LinkFormAdministratif'
    })
    const [isEditFormOpen, setIsEditFormOpen] = useState(false)
    const [tempFormInfo, setTempFormInfo] = useState<FormAdminInfo>(formAdminInfo)

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const fetchTickets = async () => {
        // This function is kept for compatibility but not used in the new design
    };

    const formatPrice = (price: string | number) => {
        const numPrice = typeof price === 'string' ? parseInt(price) : price;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(numPrice);
    };

    const handleUpdatePayment = () => {
        setPaymentInfo(tempPaymentInfo)
        setIsEditPaymentOpen(false)
        alert('Informasi pembayaran berhasil diperbarui!')
    }

    const handleUpdateForm = () => {
        setFormAdminInfo(tempFormInfo)
        setIsEditFormOpen(false)
        alert('Link form berhasil diperbarui!')
    }

    const handleCopyLink = () => {
        navigator.clipboard.writeText(formAdminInfo.link)
        alert('Link berhasil disalin!')
    }

    const handleOpenDetailModal = async (jadwal: any) => {
        setSelectedJadwal(jadwal);
        setIsDetailModalOpen(true);
        setIsLoadingParticipants(true);
        try {
            const [participantsResponse, usersResponse] = await Promise.all([
                api.get(`/admin/training-schedules/${jadwal.id}/participants`),
                api.get('/users')
            ]);

            const participantsData = participantsResponse.data.data || [];
            const usersData = usersResponse.data.data || [];
            const usersMap = new Map(usersData.map((user: any) => [user.id, user]));

            const enrichedParticipants = participantsData.map((participant: any) => ({
                ...participant,
                user: usersMap.get(participant.user.id) || participant.user
            }));

            setParticipants(enrichedParticipants);
        } catch (error) {
            console.error("Failed to fetch participants:", error);
        } finally {
            setIsLoadingParticipants(false);
        }
    };

    const handleDeleteSchedule = async () => {
        setIsDeleting(true);

        try {
            await api.delete(`/training-schedules/${selectedJadwal.id}`);
            setShowConfirmDialog(false);
            setIsDetailModalOpen(false);
            alert("Jadwal berhasil dihapus.");
            const updated = await api.get('/admin/training-schedules')
            setListJadwalPelatihan(updated.data.data || [])
        } catch (error) {
            console.error("Gagal menghapus jadwal:", error);
            alert("Terjadi kesalahan saat menghapus jadwal.");
        } finally {
            setIsDeleting(false);
        }
    };

    const getAttendanceStatus = (participant: any) => {
        if (participant.presence?.attended_at) {
            return { status: "Hadir", color: "text-green-600 bg-green-50", icon: CheckCircle };
        }
        const trainingDate = new Date(selectedJadwal.started_at);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (trainingDate < today) {
            return { status: "Tidak Hadir", color: "text-red-600 bg-red-50", icon: XCircle };
        }

        return { status: "Belum di absen", color: "text-yellow-600 bg-yellow-50", icon: AlertCircle };
    };

    const handleHadir = async (participant: any) => {
        if (confirm("Apakah Anda yakin ingin menandai peserta ini sebagai hadir?")) {
            try {
                await api.post(`/user-tickets/${participant.id}/presences`);
                alert("Peserta telah ditandai sebagai hadir.");
                if (selectedJadwal) {
                    handleOpenDetailModal(selectedJadwal);
                }
            } catch (error) {
                console.error("Failed to mark participant as present:", error);
                alert("Gagal menandai peserta sebagai hadir.");
            }
        }
    };

    const handleExportParticipants = () => {
        if (!participants || participants.length === 0) {
            alert("Tidak ada data peserta untuk diekspor.");
            return;
        }

        const csvContent = [
            ["Nama", "NIM", "Email", "WhatsApp", "Judul Artikel", "Status Kehadiran"],
            ...participants.map(p => [
                p.user.name,
                p.user.student_number,
                p.user.email,
                p.user.mobile_number,
                p.user.user_tickets?.[0]?.user_ticket_detail?.article_title || '-',
                getAttendanceStatus(p).status
            ])
        ].map(row => row.map(cell => {
            if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
                return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
        }).join(',')).join('\n');

        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `peserta_pelatihan_${selectedJadwal?.subtitle}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const sortedJadwal = listJadwalPelatihan.slice().sort((a, b) => {
        return new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
    })

    const filteredJadwal = sortedJadwal.filter(jadwal =>
        jadwal.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        jadwal.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        jadwal.lecturer.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const totalPages = Math.ceil(filteredJadwal.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const visibleJadwal = filteredJadwal.slice(startIndex, endIndex);

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    useEffect(() => {
        api.get('/admin/training-schedules')
            .then(res => {
                setListJadwalPelatihan(res.data.data || [])
            })
            .catch(err => {
                console.log('❌ Gagal ambil jadwal', err)
            })
    }, []);

    const handleSubmit = async () => {
        if (!jadwalPelatihan.started_at || !jadwalPelatihan.ended_at) {
            alert('Mohon isi tanggal dan waktu mulai & selesai pelatihan!')
            return
        }

        if (!jadwalPelatihan.batch_number || !jadwalPelatihan.subtitle || !jadwalPelatihan.location || !jadwalPelatihan.lecturer || !jadwalPelatihan.quota) {
            alert('Mohon lengkapi semua field!')
            return
        }

        try {
            const localStart = new Date(jadwalPelatihan.started_at);
            const localEnd = new Date(jadwalPelatihan.ended_at);
            const isoStart = localStart.toISOString();
            const isoEnd = localEnd.toISOString();

            const response = await api.post('/training-schedules', {
                batch_number: jadwalPelatihan.batch_number,
                started_at: isoStart,
                ended_at: isoEnd,
                subtitle: jadwalPelatihan.subtitle,
                location: jadwalPelatihan.location,
                quota: parseInt(jadwalPelatihan.quota),
                current_quota: 0,
                lecturer: jadwalPelatihan.lecturer
            })

            setJadwalPelatihan({
                batch_number: '',
                started_at: '',
                ended_at: '',
                subtitle: '',
                location: '',
                quota: '',
                lecturer: '',
            })
            setIsDialogOpen(false)

            console.log('✅ Jadwal berhasil disimpan', response.data)
            alert('Jadwal pelatihan berhasil ditambahkan!')
            const updated = await api.get('/admin/training-schedules')
            setListJadwalPelatihan(updated.data.data || [])
        } catch (err: any) {
            console.log('❌ Gagal tambah jadwal', err)
            const errorMessage = err.response?.data?.message || 'Gagal menyimpan jadwal pelatihan.'
            alert(errorMessage)
        }
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Payment Information Section */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Informasi Pembayaran Pelatihan</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Biaya Pelatihan</p>
                            <p className="font-semibold text-gray-800">{formatPrice(paymentInfo.biaya)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Nomor Rekening</p>
                            <p className="font-semibold text-gray-800">{paymentInfo.nomor_rekening}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Nama Pemilik Rekening</p>
                            <p className="font-semibold text-gray-800">{paymentInfo.nama_pemilik}</p>
                        </div>
                        <div className="flex items-end">
                            <Button
                                onClick={() => {
                                    setTempPaymentInfo(paymentInfo)
                                    setIsEditPaymentOpen(true)
                                }}
                                className='bg-[#5C7B78] hover:bg-[#4e6a67] text-white w-full'
                            >
                                Edit
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Form Admin Link Section */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Informasi Link Form Administratif</h2>
                    </div>
                    <div className="flex gap-4 items-end">
                        <div className="flex-1 relative">
                            <Input
                                value={formAdminInfo.link}
                                readOnly
                                className="pr-10"
                            />
                            <button
                                onClick={handleCopyLink}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded"
                                title="Salin link"
                            >
                                <Copy className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                        <Button
                            onClick={() => {
                                setTempFormInfo(formAdminInfo)
                                setIsEditFormOpen(true)
                            }}
                            className='bg-[#5C7B78] hover:bg-[#4e6a67] text-white'
                        >
                            Edit
                        </Button>
                    </div>
                </div>

                {/* Jadwal Pelatihan Section */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <CalendarIcon className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-800">Jadwal Pelatihan</h1>
                                </div>
                            </div>

                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className='bg-[#5C7B78] hover:bg-[#4e6a67] text-white'>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Tambah Jadwal
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Jadwal Pelatihan Baru</DialogTitle>
                                        <DialogDescription>
                                            Buat jadwal pelatihan baru untuk peserta
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="batch">Batch Pelatihan</Label>
                                            <Input
                                                id="batch"
                                                placeholder='contoh: Batch 1'
                                                value={jadwalPelatihan.batch_number}
                                                onChange={(e) => setJadwalPelatihan({ ...jadwalPelatihan, batch_number: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="subtitle">Judul Pelatihan</Label>
                                            <Input
                                                id="subtitle"
                                                placeholder='contoh: Pelatihan Penulisan Artikel Ilmiah'
                                                value={jadwalPelatihan.subtitle}
                                                onChange={(e) => setJadwalPelatihan({ ...jadwalPelatihan, subtitle: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="datetime">Tanggal & Waktu Mulai</Label>
                                            <Input
                                                type="datetime-local"
                                                id="datetime"
                                                value={jadwalPelatihan.started_at}
                                                onChange={(e) => setJadwalPelatihan({ ...jadwalPelatihan, started_at: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="end-datetime">Tanggal & Waktu Selesai</Label>
                                            <Input
                                                type="datetime-local"
                                                id="end-datetime"
                                                value={jadwalPelatihan.ended_at}
                                                onChange={(e) => setJadwalPelatihan({ ...jadwalPelatihan, ended_at: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="lokasi">Lokasi Pelatihan</Label>
                                            <Input
                                                id="lokasi"
                                                placeholder='contoh: Gedung G15 Ruang 101'
                                                value={jadwalPelatihan.location}
                                                onChange={(e) => setJadwalPelatihan({ ...jadwalPelatihan, location: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="journal-group">Kelompok Jurnal</Label>
                                            <Select
                                                // value={jadwalPelatihan.journal_group || ""}
                                                // onValueChange={(value) => setJadwalPelatihan({ ...jadwalPelatihan, journal_group: value })}
                                            >
                                                <SelectTrigger id="journal-group" className="w-full text-sm">
                                                    <SelectValue placeholder="Pilih Kelompok Jurnal" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="jie">JIE (Journal of Indonesian Economy)</SelectItem>
                                                    <SelectItem value="jofei">JOFEI (Journal of Financial Economics and Investment)</SelectItem>
                                                    <SelectItem value="joesment">JOESMENT (Journal of Economics and Management)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="dosen">Dosen Pendamping</Label>
                                            <Input
                                                id="dosen"
                                                placeholder='contoh: Dr. Ahmad Fauzi, M.Kom'
                                                value={jadwalPelatihan.lecturer}
                                                onChange={(e) => setJadwalPelatihan({ ...jadwalPelatihan, lecturer: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="kuota">Kuota Peserta</Label>
                                            <Input
                                                id="kuota"
                                                type="number"
                                                min="1"
                                                placeholder='contoh: 30'
                                                value={jadwalPelatihan.quota}
                                                onChange={(e) => setJadwalPelatihan({ ...jadwalPelatihan, quota: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button variant="outline">Batal</Button>
                                        </DialogClose>
                                        <Button onClick={handleSubmit} className="bg-[#5C7B78] hover:bg-[#4e6a67]">
                                            Simpan Jadwal
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Cari Judul, Lokasi, atau Dosen"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Schedule Cards Grid */}
                    {filteredJadwal.length > 0 ? (
                        <div className='space-y-6'>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {visibleJadwal.map((jadwal: any) => (
                                    <div key={jadwal.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all">
                                        <div className="bg-gradient-to-r from-[#5C7B78] to-[#4e6a67] p-4 text-white rounded-t-xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CalendarIcon className="w-5 h-5" />
                                                <span className="text-xs">{jadwal.batch_number} | {jadwal.subtitle}</span>
                                            </div>
                                            <h2 className="text-lg font-bold">
                                                {new Date(jadwal.started_at).toLocaleDateString('id-ID', {
                                                    weekday: 'long',
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </h2>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            <div className="flex items-start gap-2 text-sm">
                                                <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-gray-700">{jadwal.location}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock className="w-4 h-4 text-gray-500" />
                                                <span className="text-gray-700">
                                                    {new Date(jadwal.started_at).toLocaleTimeString('id-ID', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })} - {new Date(jadwal.ended_at).toLocaleTimeString('id-ID', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })} WIB
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Users className="w-4 h-4 text-gray-500" />
                                                <span className="text-gray-700">
                                                    Kelompok Jurnal: <span className="font-semibold">{jadwal.lecturer}</span>
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Users className="w-4 h-4 text-gray-500" />
                                                <span className="text-gray-700">
                                                    Dosen Pembimbing: <span className="font-semibold">{jadwal.lecturer}</span>
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Users className="w-4 h-4 text-gray-500" />
                                                <span className="text-gray-700">
                                                    Sisa Kuota: <span className="font-semibold text-red-600">{jadwal.quota} Peserta</span>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="px-4 pb-4">
                                            <Button
                                                onClick={() => handleOpenDetailModal(jadwal)}
                                                className='w-full bg-[#5C7B78] hover:bg-[#4e6a67] text-white'
                                            >
                                                Lihat Detail
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-between items-center mt-6 text-sm">
                                    <span className="text-gray-600">
                                        Menampilkan 1-{Math.min(ITEMS_PER_PAGE, filteredJadwal.length)} dari {filteredJadwal.length} Peserta
                                    </span>
                                    <div className="flex gap-2 items-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                        >
                                            «
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handlePrev}
                                            disabled={currentPage === 1}
                                        >
                                            ‹ Prev
                                        </Button>
                                        <span className="px-3">
                                            Halaman {currentPage} dari {totalPages}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleNext}
                                            disabled={currentPage === totalPages}
                                        >
                                            Next ›
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setCurrentPage(totalPages)}
                                            disabled={currentPage === totalPages}
                                        >
                                            »
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg font-medium">
                                {searchQuery ? 'Tidak ada jadwal ditemukan' : 'Belum ada jadwal pelatihan'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Payment Info Dialog */}
            <Dialog open={isEditPaymentOpen} onOpenChange={setIsEditPaymentOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Informasi Pembayaran Pelatihan</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="biaya">Biaya Pelatihan</Label>
                            <Input
                                id="biaya"
                                type="number"
                                value={tempPaymentInfo.biaya}
                                onChange={(e) => setTempPaymentInfo({ ...tempPaymentInfo, biaya: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="rekening">Nomor Rekening</Label>
                            <Input
                                id="rekening"
                                value={tempPaymentInfo.nomor_rekening}
                                onChange={(e) => setTempPaymentInfo({ ...tempPaymentInfo, nomor_rekening: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="pemilik">Nama Pemilik Rekening</Label>
                            <Input
                                id="pemilik"
                                value={tempPaymentInfo.nama_pemilik}
                                onChange={(e) => setTempPaymentInfo({ ...tempPaymentInfo, nama_pemilik: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditPaymentOpen(false)}
                            className="text-[#D84C4C] border-[#D84C4C]"
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleUpdatePayment}
                            className="bg-[#5C7B78] hover:bg-[#4e6a67]"
                        >
                            Update
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Form Link Dialog */}
            <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Link Form Administratif</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="form-link">Link Form</Label>
                            <Input
                                id="form-link"
                                value={tempFormInfo.link}
                                onChange={(e) => setTempFormInfo({ ...tempFormInfo, link: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditFormOpen(false)}
                            className="text-[#D84C4C] border-[#D84C4C]"
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleUpdateForm}
                            className="bg-[#5C7B78] hover:bg-[#4e6a67]"
                        >
                            Update
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Detail Modal */}
            <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                <DialogContent
                    className="!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !p-0 !m-0 !border-none !rounded-none !bg-gray-50 !overflow-hidden !z-50 !translate-x-0 !translate-y-0"
                    showCloseButton={false}
                >
                    <DialogTitle className="sr-only">Detail Jadwal Pelatihan</DialogTitle>

                    <div className="absolute inset-0 w-full h-full overflow-y-auto">
                        <div className="min-h-full flex flex-col">
                            <div className="sticky top-0 left-0 w-full bg-white z-10 border-b shadow-sm">
                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-800">Detail Jadwal Pelatihan</h2>
                                    <button
                                        onClick={() => setIsDetailModalOpen(false)}
                                        className="text-gray-500 hover:text-gray-800 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                                    >
                                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
                                    {selectedJadwal && (
                                        <>
                                            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                                                <h3 className="font-bold text-lg sm:text-xl mb-4 text-gray-800 flex items-center gap-2">
                                                    <div className="w-2 h-6 bg-blue-500 rounded"></div>
                                                    Informasi Jadwal
                                                </h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-gray-500">Judul Pelatihan</p>
                                                        <p className="font-semibold text-gray-800">{selectedJadwal.subtitle}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-gray-500">Batch</p>
                                                        <p className="font-semibold text-gray-800">{selectedJadwal.batch_number}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-gray-500">Tanggal Pelatihan</p>
                                                        <p className="font-semibold text-gray-800">
                                                            {new Date(selectedJadwal.started_at).toLocaleDateString('id-ID', {
                                                                weekday: 'long',
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric',
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-gray-500">Waktu Pelatihan</p>
                                                        <p className="font-semibold text-gray-800">
                                                            {new Date(selectedJadwal.started_at).toLocaleTimeString('id-ID', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })} - {new Date(selectedJadwal.ended_at).toLocaleTimeString('id-ID', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })} WIB
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-gray-500">Dosen Pendamping</p>
                                                        <p className="font-semibold text-gray-800">{selectedJadwal.lecturer}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-gray-500">Lokasi Pelatihan</p>
                                                        <p className="font-semibold text-gray-800">{selectedJadwal.location}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-gray-500">Kuota Peserta</p>
                                                        <p className="font-semibold text-gray-800">{selectedJadwal.quota} peserta</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-gray-500">Jumlah Peserta Terdaftar</p>
                                                        <p className="font-semibold text-gray-800">{participants.length} orang</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                                    <h3 className="font-bold text-lg sm:text-xl text-gray-800 flex items-center gap-2">
                                                        <div className="w-2 h-6 bg-green-500 rounded"></div>
                                                        Daftar Peserta
                                                    </h3>
                                                    <Button
                                                        variant="outline"
                                                        className="text-[#5C7B78] border-[#5C7B78] hover:bg-[#5C7B78] hover:text-white w-full sm:w-auto"
                                                        onClick={handleExportParticipants}
                                                    >
                                                        <Download className="w-4 h-4 mr-2" />
                                                        Export CSV
                                                    </Button>
                                                </div>

                                                {isLoadingParticipants ? (
                                                    <div className="text-center py-12">
                                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5C7B78] mx-auto mb-4"></div>
                                                        <p className="text-gray-600">Memuat data peserta...</p>
                                                    </div>
                                                ) : participants.length > 0 ? (
                                                    <div className="overflow-x-auto">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow className="bg-gray-50">
                                                                    <TableHead className="font-semibold text-gray-700">Nama</TableHead>
                                                                    <TableHead className="font-semibold text-gray-700">NIM</TableHead>
                                                                    <TableHead className="font-semibold text-gray-700">Email</TableHead>
                                                                    <TableHead className="font-semibold text-gray-700">WhatsApp</TableHead>
                                                                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                                                                    <TableHead className="font-semibold text-gray-700">Aksi</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {participants.map((participant: any) => {
                                                                    const attendance = getAttendanceStatus(participant);
                                                                    const Icon = attendance.icon;
                                                                    return (
                                                                        <TableRow key={participant.id} className="hover:bg-gray-50">
                                                                            <TableCell className="font-medium">{participant.user.name}</TableCell>
                                                                            <TableCell>{participant.user.student_number}</TableCell>
                                                                            <TableCell>{participant.user.email}</TableCell>
                                                                            <TableCell>{participant.user.mobile_number}</TableCell>
                                                                            <TableCell>
                                                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${attendance.color}`}>
                                                                                    <Icon className="w-3 h-3" />
                                                                                    {attendance.status}
                                                                                </span>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Button
                                                                                    size="sm"
                                                                                    className="bg-green-500 hover:bg-green-600 text-white"
                                                                                    onClick={() => handleHadir(participant)}
                                                                                    disabled={attendance.status === 'Hadir'}
                                                                                >
                                                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                                                    Hadir
                                                                                </Button>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    );
                                                                })}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-12">
                                                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                                        <p className="text-gray-500 font-medium">Belum ada peserta terdaftar</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className='text-center'>
                                                <Button
                                                    variant={participants.length > 0 ? "outline" : "destructive"}
                                                    onClick={() => setShowConfirmDialog(true)}
                                                    disabled={participants.length > 0 || isDeleting}
                                                    className={participants.length > 0 ? "cursor-not-allowed opacity-70" : "bg-[#D84C4C]"}
                                                >
                                                    {participants.length > 0 ? "Jadwal Tidak Bisa Dihapus" : "Hapus Jadwal"}
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirm Delete Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center">
                            Yakin mau menghapus jadwal pelatihan ini?
                        </DialogTitle>
                    </DialogHeader>
                    {selectedJadwal && (
                        <div className="my-4">
                            <div className="bg-gradient-to-r from-[#5C7B78] to-[#4e6a67] p-4 text-white rounded-xl mb-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <CalendarIcon className="w-5 h-5" />
                                    <span className="text-xs">{selectedJadwal.batch_number} | {selectedJadwal.subtitle}</span>
                                </div>
                                <h2 className="text-lg font-bold">
                                    {new Date(selectedJadwal.started_at).toLocaleDateString('id-ID', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </h2>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex gap-2">
                                    <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                                    <span>{selectedJadwal.location}</span>
                                </div>
                                <div className="flex gap-2">
                                    <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                    <span>
                                        {new Date(selectedJadwal.started_at).toLocaleTimeString('id-ID', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })} - {new Date(selectedJadwal.ended_at).toLocaleTimeString('id-ID', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })} WIB
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                    <span>Dosbing: <strong>{selectedJadwal.lecturer}</strong></span>
                                </div>
                                <div className="flex gap-2">
                                    <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                    <span>Kuota: <strong className="text-red-600">{selectedJadwal.quota} peserta</strong></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={handleDeleteSchedule}
                            disabled={isDeleting}
                            className="border-[#D84C4C] text-[#D84C4C] hover:bg-[#FEECEC] flex-1"
                        >
                            {isDeleting ? "Menghapus..." : "Ya, Hapus"}
                        </Button>
                        <Button
                            className="bg-[#5B7870] hover:bg-[#4F6760] text-white flex-1"
                            onClick={() => setShowConfirmDialog(false)}
                            disabled={isDeleting}
                        >
                            Batal
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}