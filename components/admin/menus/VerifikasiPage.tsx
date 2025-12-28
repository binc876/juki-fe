'use client'

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    CheckCircle,
    Search,
    Download,
    Eye,
    Clock,
    Filter,
    UserCheck
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface User {
    id: number;
    name: string;
    student_number: string;
    mobile_number: string;
    user_tickets: {
        id: number;
        approved_by_admin_at: string | null;
        training_schedule_id: number;
        user_ticket_detail: {
            id: number;
            payment_evidence_path: string;
            payment_evidence_url: string;
            statement_letter_path: string;
            statement_letter_url: string;
        } | null;
    }[];
}


interface TrainingSchedule {
    id: number;
    started_at: string;
    ended_at: string;
}

export default function VerifikasiPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [trainingSchedules, setTrainingSchedules] = useState<TrainingSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const truncateFileName = (fileName: string, maxLength = 25) => {
        if (!fileName) return '-';
        if (fileName.length <= maxLength) {
            return fileName;
        }
        const extension = fileName.split('.').pop();
        const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
        const truncatedName = nameWithoutExt.substring(0, maxLength - extension!.length - 4);
        return `${truncatedName}...${extension}`;
    };

    const fetchUsersToVerify = async () => {
        setLoading(true);
        try {
            const [usersResponse, schedulesResponse] = await Promise.all([
                api.get('/users', {
                    headers: { 'ngrok-skip-browser-warning': 'true' }
                }),
                api.get('/admin/training-schedules', {
                    headers: { 'ngrok-skip-browser-warning': 'true' }
                })
            ]);

            if (usersResponse.data && usersResponse.data.data) {
                const usersWithTickets = usersResponse.data.data.filter(
                    (user: User) =>
                        user.user_tickets &&
                        user.user_tickets.length > 0 &&
                        user.user_tickets[0].user_ticket_detail &&
                        user.user_tickets[0].user_ticket_detail.payment_evidence_path &&
                        user.user_tickets[0].user_ticket_detail.statement_letter_path
                );
                setUsers(usersWithTickets);
                setFilteredUsers(usersWithTickets);
            }

            if (schedulesResponse.data && schedulesResponse.data.data) {
                setTrainingSchedules(schedulesResponse.data.data);
            }

        } catch (error) {
            console.error("Failed to fetch data:", error);
            alert('Gagal memuat data. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsersToVerify();
    }, []);

    // Filter and search logic
    useEffect(() => {
        let filtered = users;

        // Filter by status
        if (filterStatus !== 'all') {
            if (filterStatus === 'approved') {
                filtered = filtered.filter(user => user.user_tickets?.[0]?.approved_by_admin_at !== null);
            } else if (filterStatus === 'pending') {
                filtered = filtered.filter(user => user.user_tickets?.[0]?.approved_by_admin_at === null);
            }
        }

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(user =>
                user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.student_number.includes(searchQuery) ||
                user.mobile_number.includes(searchQuery)
            );
        }

        setFilteredUsers(filtered);
    }, [searchQuery, filterStatus, users]);

    const handleApprove = async (userTicketId: number, userName: string) => {
        if (confirm(`Apakah Anda yakin ingin menyetujui pendaftaran ${userName}?`)) {
            try {
                await api.put(`/user-tickets/${userTicketId}/update-verification-status`);
                alert('Pendaftaran telah disetujui.');
                fetchUsersToVerify();
            } catch (error) {
                console.error('Failed to approve verification:', error);
                alert('Gagal menyetujui pendaftaran.');
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

    const formatDateTime = (dateTimeString: string) => {
        const date = new Date(dateTimeString);
        return date.toLocaleDateString('id-ID', { dateStyle: 'long' });
    };

    const getScheduleDate = (scheduleId: number) => {
        const schedule = trainingSchedules.find(s => s.id === scheduleId);
        if (!schedule) return '-';
        return (
            <div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <p>{formatDateTime(schedule.started_at)}</p>
                </div>
                {/* <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <p>{formatDateTime(schedule.ended_at)}</p>
                </div> */}
            </div>
        );
    };

    const getStatusBadge = (approvedAt: string | null) => {
        if (approvedAt) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3" />
                    Disetujui
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

    const handleExportCSV = () => {
        if (!filteredUsers || filteredUsers.length === 0) {
            alert("Tidak ada data verifikasi untuk diekspor.");
            return;
        }

        const csvContent = [
            ["No", "Nama", "NIM", "WhatsApp", "Tanggal Pelatihan", "Status", "Bukti Pembayaran", "Surat Pernyataan"],
            ...filteredUsers.map((user, index) => [
                (index + 1).toString(),
                user.name,
                user.student_number,
                normalizeWhatsApp(user.mobile_number),
                user.user_tickets?.[0]?.training_schedule_id?.toString() || '-',
                user.user_tickets?.[0]?.approved_by_admin_at ? 'Disetujui' : 'Menunggu Verifikasi',
                user.user_tickets?.[0]?.user_ticket_detail?.payment_evidence_url || '-',
                user.user_tickets?.[0]?.user_ticket_detail?.statement_letter_url || '-'
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
        const link = document.createElement('a');
        link.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        link.download = `verifikasi_pendaftaran_${dateStr}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div>
                                    <h1 className="text-lg sm:text-xl font-bold text-gray-800">Verifikasi</h1>
                                    <p className="text-xs sm:text-sm text-gray-600">
                                        Total: {filteredUsers.length} Data belum terverifikasi
                                    </p>
                                </div>
                            </div>
                            {/* 
                            <Button
                                onClick={handleExportCSV}
                                variant="outline"
                                className="text-[#5C7B78] border-[#5C7B78] hover:bg-[#5C7B78] hover:text-white w-full sm:w-auto"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export CSV
                            </Button> */}
                        </div>

                        {/* Search and Filter */}
                        <div className="flex justify-end gap-3">
                            <Button
                                onClick={() => { }}
                                className="bg-[#5C7B78] hover:bg-[#4e6a67] text-white px-6"
                            >
                                Form
                            </Button>

                            <Button
                                onClick={() => { }}
                                className="bg-[#5C7B78] hover:bg-[#4e6a67] text-white px-6"
                            >
                                Pembayaran
                            </Button>
                        </div>

                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5C7B78] mx-auto mb-4"></div>
                                <p className="text-gray-600 text-sm">Memuat data verifikasi...</p>
                            </div>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-16">
                            <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg font-medium">Tidak ada pendaftaran ditemukan</p>
                            <p className="text-gray-400 text-sm mt-1">
                                {searchQuery ? 'Coba ubah kata kunci pencarian' : 'Belum ada pendaftaran yang perlu diverifikasi'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Nama</TableHead>
                                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">NIM</TableHead>
                                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Email</TableHead>
                                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Bukti Pembayaran</TableHead>
                                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => {
                                        const ticket = user.user_tickets?.[0];
                                        const detail = ticket?.user_ticket_detail;

                                        return (
                                            <TableRow key={user.id} className="hover:bg-gray-50 transition-colors">
                                                <TableCell className="text-xs sm:text-sm text-gray-900 font-medium">
                                                    {user.name}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">
                                                    {user.student_number}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">
                                                    {normalizeWhatsApp(user.mobile_number)}
                                                </TableCell>

                                                <TableCell className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">
                                                    {getScheduleDate(ticket?.training_schedule_id)}
                                                </TableCell>

                                                <TableCell className="text-xs sm:text-sm">
                                                    <a
                                                        href={detail?.payment_evidence_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                        <span className="truncate max-w-[150px]">
                                                            {truncateFileName(detail?.payment_evidence_path || 'Lihat File')}
                                                        </span>
                                                    </a>
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm">
                                                    <a
                                                        href={detail?.statement_letter_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                        <span className="truncate max-w-[150px]">
                                                            {truncateFileName(detail?.statement_letter_path || 'Lihat File')}
                                                        </span>
                                                    </a>
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                                                    {getStatusBadge(ticket?.approved_by_admin_at || null)}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-500 hover:bg-green-600 text-white text-xs"
                                                        onClick={() => ticket && handleApprove(ticket.id, user.name)}
                                                        disabled={ticket?.approved_by_admin_at !== null}
                                                    >
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Setujui
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}