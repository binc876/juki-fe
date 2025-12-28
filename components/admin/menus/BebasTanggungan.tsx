'use client'

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
    Shield, 
    Search, 
    Download, 
    CheckCircle,
    XCircle,
    Clock,
    Filter,
    Eye,
    FileText,
    X
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface LiabilityFree {
    id: number;
    user_id: number;
    is_accepted_by_admin: number;
    accepted_at: string | null;
    rejection_reason: string | null;
    submission_location: string;
    submitted_journal_link: string;
    free_of_plagiarism_url: string;
    free_of_plagiarism_naspub_url: string;
    thesis_cover_letter_url: string;
    thesis_introduction_url: string;
    thesis_chapter_1_url: string;
    thesis_chapter_2_url: string;
    thesis_chapter_3_url: string;
    thesis_chapter_4_url: string;
    thesis_chapter_5_url: string;
    thesis_chapter_other_url: string;
    thesis_approval_sheet_url: string;
    thesis_liability_letter_url: string;
    alumni_donation_url: string;
    judiciary_evidence_url: string;
    user: {
        id: number;
        name: string;
        student_number: string;
        email: string;
        mobile_number: string;
    };
    user_ticket: {
        id: number;
        training_schedule_id: number | null;
        user_ticket_detail: {
            id: number;
            article_title: string | null;
        } | null;
    } | null;
}

interface UserTicket {
    id: number;
    approved_by_admin_at: string | null;
    training_schedule_id: number | null;
    user_ticket_detail: {
        id: number;
        article_title: string | null;
    } | null;
}

interface User {
    id: number;
    name: string;
    student_number: string;
    email: string;
    mobile_number: string;
    user_tickets: UserTicket[];
}

export default function BebasTanggungan() {
    const [liabilityFrees, setLiabilityFrees] = useState<LiabilityFree[]>([]);
    const [filteredLiabilityFrees, setFilteredLiabilityFrees] = useState<LiabilityFree[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedLiabilityFree, setSelectedLiabilityFree] = useState<LiabilityFree | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [liabilityFreesResponse, usersResponse] = await Promise.all([
                api.get('/liability-frees', {
                    headers: { 'ngrok-skip-browser-warning': 'true' }
                }),
                api.get('/users', {
                    headers: { 'ngrok-skip-browser-warning': 'true' }
                })
            ]);

            if (liabilityFreesResponse.data && liabilityFreesResponse.data.data && usersResponse.data && usersResponse.data.data) {
                const usersData: User[] = usersResponse.data.data;
                const liabilityFreesData: LiabilityFree[] = liabilityFreesResponse.data.data;

                const filteredUsers = usersData.filter(user => 
                    liabilityFreesData.some(lf => lf.user_id === user.id)
                );

                const combinedData: LiabilityFree[] = filteredUsers.map(user => {
                    const liabilityFree = liabilityFreesData.find(lf => lf.user_id === user.id)!;
                    const user_ticket = user.user_tickets && user.user_tickets.length > 0 ? user.user_tickets[0] : null;

                    return {
                        ...liabilityFree,
                        user,
                        user_ticket
                    };
                });

                setLiabilityFrees(combinedData);
                setFilteredLiabilityFrees(combinedData);
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
            alert('Gagal memuat data. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let filtered = liabilityFrees;

        if (filterStatus !== 'all') {
            filtered = filtered.filter(lf => {
                if (filterStatus === 'approved') {
                    return lf.is_accepted_by_admin === 1;
                } else if (filterStatus === 'pending') {
                    return lf.is_accepted_by_admin !== 1 && (lf.is_accepted_by_admin !== 0 || !lf.rejection_reason);
                } else if (filterStatus === 'rejected') {
                    return lf.is_accepted_by_admin === 0 && lf.rejection_reason;
                }
                return true;
            });
        }

        if (searchQuery) {
            filtered = filtered.filter(lf => 
                (lf.user && lf.user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (lf.user && lf.user.student_number.includes(searchQuery)) ||
                (lf.user && lf.user.mobile_number.includes(searchQuery)) ||
                (lf.user_ticket?.user_ticket_detail?.article_title?.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        setFilteredLiabilityFrees(filtered);
    }, [searchQuery, filterStatus, liabilityFrees]);

    const handleOpenDetailModal = (liabilityFree: LiabilityFree) => {
        setSelectedLiabilityFree(liabilityFree);
        setRejectionReason(liabilityFree.rejection_reason || '');
        setIsDetailModalOpen(true);
    };

    const getStatusBadge = (liabilityFree: LiabilityFree) => {
        if (liabilityFree.is_accepted_by_admin === 1) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3" />
                    Disetujui
                </span>
            );
        } else if (liabilityFree.is_accepted_by_admin === 0 && liabilityFree.rejection_reason) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    <XCircle className="w-3 h-3" />
                    Ditolak
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                <Clock className="w-3 h-3" />
                Menunggu Verifikasi
            </span>
        );
    };

    const handleUpdateStatus = async (isAccepted: boolean) => {
        if (!selectedLiabilityFree) return;

        if (!isAccepted && !rejectionReason.trim()) {
            alert("Alasan penolakan tidak boleh kosong.");
            return;
        }

        const confirmationMessage = isAccepted 
            ? "Apakah Anda yakin ingin menyetujui bebas tanggungan ini?"
            : "Apakah Anda yakin ingin menolak bebas tanggungan ini?";

        if (confirm(confirmationMessage)) {
            try {
                await api.put(`/liability-frees/${selectedLiabilityFree.id}/update-status`, {
                    is_accepted_by_admin: isAccepted ? 1 : 0,
                    rejection_reason: isAccepted ? null : rejectionReason,
                });
                alert(`Bebas tanggungan telah ${isAccepted ? 'disetujui' : 'ditolak'}.`);
                fetchData();
                setIsDetailModalOpen(false);
            } catch (error) {
                console.error(`Failed to ${isAccepted ? 'approve' : 'reject'} liability free:`, error);
                alert(`Gagal ${isAccepted ? 'menyetujui' : 'menolak'} bebas tanggungan.`);
            }
        }
    };

    const normalizeWhatsApp = (number: string) => {
        if (number.startsWith('0')) {
            return `+62${number.substring(1)}`;
        }
        if (number.startsWith('62')) {
            return `+${number}`;
        }
        return number;
    };

    const handleExportCSV = () => {
        if (!filteredLiabilityFrees || filteredLiabilityFrees.length === 0) {
            alert("Tidak ada data bebas tanggungan untuk diekspor.");
            return;
        }

        const csvContent = [
            ["No", "Nama", "NIM", "WhatsApp", "Judul Artikel", "Status"],
            ...filteredLiabilityFrees.map((lf, index) => {
                let status = 'Menunggu Verifikasi';
                if (lf.is_accepted_by_admin === 1) {
                    status = 'Disetujui';
                } else if (lf.is_accepted_by_admin === 0 && lf.rejection_reason) {
                    status = 'Ditolak';
                }
                
                return [
                    (index + 1).toString(),
                    lf.user.name,
                    lf.user.student_number,
                    normalizeWhatsApp(lf.user.mobile_number),
                    lf.user_ticket?.user_ticket_detail?.article_title || '-',
                    status
                ];
            })
        ].map(row => row.map(cell => {
            if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
                return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
        }).join(',')).join('\n');

        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        link.download = `bebas_tanggungan_${dateStr}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const DocumentLink = ({ title, url }: { title: string, url: string | null | undefined }) => {
        const fileName = url ? url.split('/').pop() : null;
        return (
            <div>
                <p className="font-semibold text-gray-700 mb-2 text-sm">{title}</p>
                {url ? (
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center truncate flex-1 mr-2">
                            <FileText className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
                            <span className="truncate text-sm text-gray-600">{fileName}</span>
                        </div>
                        <a href={url} target="_blank" rel="noopener noreferrer" download>
                            <Button variant="outline" size="sm" className="text-xs bg-white hover:bg-gray-200">
                                <Download className="w-3 h-3 mr-1" />
                                Download
                            </Button>
                        </a>
                    </div>
                ) : (
                    <div className="flex items-center p-3 border rounded-lg bg-gray-50 text-gray-400">
                        <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="text-sm">Dokumen belum diupload</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-lg sm:text-xl font-bold text-gray-800">Bebas Tanggungan</h1>
                                    <p className="text-xs sm:text-sm text-gray-600">
                                        Total: {filteredLiabilityFrees.length} mahasiswa
                                    </p>
                                </div>
                            </div>

                            <Button 
                                onClick={handleExportCSV}
                                variant="outline" 
                                className="text-[#5C7B78] border-[#5C7B78] hover:bg-[#5C7B78] hover:text-white w-full sm:w-auto"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export CSV
                            </Button>
                        </div>

                        {/* Search and Filter */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Cari nama, NIM, WhatsApp, atau judul artikel..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 w-full text-sm"
                                />
                            </div>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7B78] bg-white"
                            >
                                <option value="all">Semua Status</option>
                                <option value="pending">Menunggu Verifikasi</option>
                                <option value="approved">Disetujui</option>
                                <option value="rejected">Ditolak</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5C7B78] mx-auto mb-4"></div>
                                <p className="text-gray-600 text-sm">Memuat data bebas tanggungan...</p>
                            </div>
                        </div>
                    ) : filteredLiabilityFrees.length === 0 ? (
                        <div className="text-center py-16">
                            <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg font-medium">Tidak ada data ditemukan</p>
                            <p className="text-gray-400 text-sm mt-1">
                                {searchQuery ? 'Coba ubah kata kunci pencarian' : 'Belum ada data bebas tanggungan'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Nama</TableHead>
                                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">NIM</TableHead>
                                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">WhatsApp</TableHead>
                                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Judul Artikel</TableHead>
                                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Status</TableHead>
                                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLiabilityFrees.map((lf) => (
                                            <TableRow key={lf.id} className="hover:bg-gray-50 transition-colors">
                                                <TableCell className="text-xs sm:text-sm text-gray-900 font-medium">
                                                    {lf.user ? lf.user.name : 'User not found'}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">
                                                    {lf.user ? lf.user.student_number : '-'}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">
                                                    {lf.user ? normalizeWhatsApp(lf.user.mobile_number) : '-'}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm text-gray-700 max-w-xs">
                                                    <div className="truncate" title={lf.user_ticket?.user_ticket_detail?.article_title || '-'}>
                                                        {lf.user_ticket?.user_ticket_detail?.article_title || '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                                                    {getStatusBadge(lf)}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                                                    <Button 
                                                        size="sm" 
                                                        className="bg-[#5C7B78] hover:bg-[#4a6360] text-white text-xs"
                                                        onClick={() => handleOpenDetailModal(lf)}
                                                    >
                                                        <Eye className="w-3 h-3 mr-1" />
                                                        Lihat Detail
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Detail */}
            <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                <DialogContent className="!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !p-0 !m-0 !border-none !rounded-none !bg-gray-100 !overflow-auto !z-50 !translate-x-0 !translate-y-0">
                    <div className="sticky top-0 left-0 w-full flex justify-between items-center p-6 bg-white z-10 border-b shadow-sm">
                        <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Shield className="w-6 h-6 text-[#5C7B78]" />
                            Data Peserta Bebas Tanggungan
                        </DialogTitle>
                        <button
                            onClick={() => setIsDetailModalOpen(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                            aria-label="Tutup"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-6 max-w-6xl mx-auto">
                        {selectedLiabilityFree ? (
                            <div className="space-y-6">
                                <div className="bg-white p-6 border rounded-xl shadow-sm">
                                    <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-[#5C7B78]" />
                                        Informasi Pribadi
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <p className="text-sm"><span className="font-semibold text-gray-700">Nama:</span> <span className="text-gray-600">{selectedLiabilityFree.user ? selectedLiabilityFree.user.name : 'User not found'}</span></p>
                                            <p className="text-sm"><span className="font-semibold text-gray-700">NIM:</span> <span className="text-gray-600">{selectedLiabilityFree.user ? selectedLiabilityFree.user.student_number : '-'}</span></p>
                                            <p className="text-sm"><span className="font-semibold text-gray-700">Email:</span> <span className="text-gray-600">{selectedLiabilityFree.user ? selectedLiabilityFree.user.email || '-' : '-'}</span></p>
                                            <p className="text-sm"><span className="font-semibold text-gray-700">WhatsApp:</span> <span className="text-gray-600">{selectedLiabilityFree.user ? normalizeWhatsApp(selectedLiabilityFree.user.mobile_number) : '-'}</span></p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm"><span className="font-semibold text-gray-700">Judul Artikel:</span> <span className="text-gray-600">{selectedLiabilityFree.user_ticket?.user_ticket_detail?.article_title || "-"}</span></p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-6 border rounded-xl shadow-sm">
                                    <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-[#5C7B78]" />
                                        Dokumen Bebas Tanggungan
                                    </h3>
                                    <>
                                        {/* Status Badge */}
                                        <div className="mb-6 p-4 rounded-lg border bg-gray-50">
                                            <p className="font-semibold text-gray-700 mb-3 text-sm">Status Verifikasi:</p>
                                            {selectedLiabilityFree.is_accepted_by_admin === 1 ? (
                                                <div className="flex items-center gap-3">
                                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                                                        <CheckCircle className="w-4 h-4" />
                                                        Disetujui
                                                    </span>
                                                    {selectedLiabilityFree.accepted_at && (
                                                        <span className="text-sm text-gray-500">pada {new Date(selectedLiabilityFree.accepted_at).toLocaleString('id-ID')}</span>
                                                    )}
                                                </div>
                                            ) : selectedLiabilityFree.is_accepted_by_admin === 0 && selectedLiabilityFree.rejection_reason ? (
                                                <div>
                                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                                                        <XCircle className="w-4 h-4" />
                                                        Ditolak
                                                    </span>
                                                    {selectedLiabilityFree.rejection_reason && (
                                                        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                                                            <p className="text-sm text-gray-700"><span className="font-semibold">Alasan:</span> {selectedLiabilityFree.rejection_reason}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                                                    <Clock className="w-4 h-4" />
                                                    Menunggu Verifikasi
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <DocumentLink title="Bukti Lolos Plagiasi Skripsi dari Prodi" url={selectedLiabilityFree.free_of_plagiarism_url} />
                                            <DocumentLink title="Bukti Lolos Plagiasi Skripsi NASPUB (LIP)" url={selectedLiabilityFree.free_of_plagiarism_naspub_url} />
                                            <div>
                                                <p className="font-semibold text-gray-700 mb-2 text-sm">Lokasi Submit Artikel</p>
                                                <p className="p-3 border rounded-lg bg-gray-50 text-sm text-gray-600">{selectedLiabilityFree.submission_location}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-700 mb-2 text-sm">Link Artikel yang Dikirim</p>
                                                <a href={selectedLiabilityFree.submitted_journal_link} target="_blank" rel="noopener noreferrer" className="p-3 border rounded-lg bg-gray-50 text-sm text-blue-600 hover:text-blue-700 hover:underline block truncate">{selectedLiabilityFree.submitted_journal_link}</a>
                                            </div>
                                            <DocumentLink title="Cover Skripsi" url={selectedLiabilityFree.thesis_cover_letter_url} />
                                            <DocumentLink title="Pendahuluan Skripsi" url={selectedLiabilityFree.thesis_introduction_url} />
                                            <DocumentLink title="Skripsi Bab 1" url={selectedLiabilityFree.thesis_chapter_1_url} />
                                            <DocumentLink title="Skripsi Bab 2" url={selectedLiabilityFree.thesis_chapter_2_url} />
                                            <DocumentLink title="Skripsi Bab 3" url={selectedLiabilityFree.thesis_chapter_3_url} />
                                            <DocumentLink title="Skripsi Bab 4" url={selectedLiabilityFree.thesis_chapter_4_url} />
                                            <DocumentLink title="Skripsi Bab 5" url={selectedLiabilityFree.thesis_chapter_5_url} />
                                            <DocumentLink title="Skripsi Bab Lainnya" url={selectedLiabilityFree.thesis_chapter_other_url} />
                                            <DocumentLink title="Lembar Pengesahan Skripsi" url={selectedLiabilityFree.thesis_approval_sheet_url} />
                                            <DocumentLink title="Surat Keterangan Bebas Tanggungan" url={selectedLiabilityFree.thesis_liability_letter_url} />
                                            <DocumentLink title="Bukti Pembayaran Donasi Alumni" url={selectedLiabilityFree.alumni_donation_url} />
                                            <DocumentLink title="Bukti Kehadiran Yudisium" url={selectedLiabilityFree.judiciary_evidence_url} />
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        {selectedLiabilityFree.is_accepted_by_admin !== 1 && (
                                            <div className="pt-6 border-t">
                                                <div className="mb-4">
                                                    <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
                                                        Komentar (Wajib diisi jika ditolak)
                                                    </label>
                                                    <Textarea
                                                        id="rejectionReason"
                                                        value={rejectionReason}
                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                        placeholder="Tuliskan alasan penolakan atau komentar lainnya di sini..."
                                                        className="w-full text-sm"
                                                        rows={4}
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-3">
                                                    <Button 
                                                        size="sm" 
                                                        className="bg-green-500 hover:bg-green-600 text-white"
                                                        onClick={() => handleUpdateStatus(true)}
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        Setujui
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        className="bg-red-500 hover:bg-red-600 text-white"
                                                        onClick={() => handleUpdateStatus(false)}
                                                    >
                                                        <XCircle className="w-4 h-4 mr-1" />
                                                        Tolak
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}