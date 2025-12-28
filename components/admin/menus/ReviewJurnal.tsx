'use client'

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    FileText, 
    Search, 
    Download, 
    CheckCircle, 
    XCircle, 
    Eye,
    Clock,
    Filter
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
    user_tickets: {
        id: number;
        user_ticket_detail: {
            id: number;
            article_title: string;
            article_path: string;
            article_url: string;
            article_revision_evidence_path: string;
            article_revision_evidence_url: string;
            article_revision_status?: string;
        } | null;
    }[];
}

export default function ReviewJurnal() {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
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

    const fetchJournals = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users', {
                headers: {
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            if (response.data && response.data.data) {
                const usersWithTickets = response.data.data.filter((user: User) => {
                    const detail = user.user_tickets?.[0]?.user_ticket_detail;
                    if (!detail) return false;

                    const hasArticle = detail.article_url !== null && detail.article_url !== undefined;
                    const needsRevision = detail.article_revision_status === 'revise';

                    if (!hasArticle && !needsRevision) {
                        return false;
                    }

                    return true;
                });
                setUsers(usersWithTickets);
                setFilteredUsers(usersWithTickets);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
            alert('Gagal memuat data artikel. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJournals();
    }, []);

    // Filter and search logic
    useEffect(() => {
        let filtered = users;

        // Filter by status
        if (filterStatus !== 'all') {
            filtered = filtered.filter(user => {
                const detail = user.user_tickets?.[0]?.user_ticket_detail;
                if (filterStatus === 'waiting') {
                    return detail?.article_url !== null && detail?.article_revision_status === null;
                }
                return detail?.article_revision_status === filterStatus;
            });
        }

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(user => 
                user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.student_number.includes(searchQuery) ||
                user.user_tickets?.[0]?.user_ticket_detail?.article_title?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredUsers(filtered);
    }, [searchQuery, filterStatus, users]);

    const handleApprove = async (id: number, userName: string) => {
        if (confirm(`Apakah Anda yakin ingin menyetujui artikel milik ${userName}?`)) {
            try {
                await api.put(`/user-ticket-details/${id}/update-article-revision-status`, {
                    article_revision_status: 'approved',
                });
                alert('Artikel telah disetujui.');
                fetchJournals();
            } catch (error) {
                console.error('Failed to approve journal:', error);
                alert('Gagal menyetujui artikel.');
            }
        }
    };

    const handleReject = async (id: number, userName: string) => {
        if (confirm(`Apakah Anda yakin ingin menolak artikel milik ${userName}?`)) {
            try {
                await api.put(`/user-ticket-details/${id}/update-article-revision-status`, {
                    article_revision_status: 'revise',
                });
                alert('Artikel telah ditolak dan perlu direvisi.');
                fetchJournals();
            } catch (error) {
                console.error('Failed to reject journal:', error);
                alert('Gagal menolak artikel.');
            }
        }
    };

    const getStatusBadge = (detail: User['user_tickets'][0]['user_ticket_detail']) => {
        if (!detail) return null;

        if (detail.article_revision_status === 'approved') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3" />
                    Disetujui
                </span>
            );
        }

        if (detail.article_revision_status === 'revise') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    <XCircle className="w-3 h-3" />
                    Perlu Revisi
                </span>
            );
        }

        if (detail.article_url) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                    <Clock className="w-3 h-3" />
                    Menunggu Review
                </span>
            );
        }

        return null;
    };

    const handleExportCSV = () => {
        if (!filteredUsers || filteredUsers.length === 0) {
            alert("Tidak ada data artikel untuk diekspor.");
            return;
        }

        const csvContent = [
            ["No", "Nama", "NIM", "Judul Artikel", "Status", "File Artikel", "Bukti Revisi"],
            ...filteredUsers.map((user, index) => [
                (index + 1).toString(),
                user.name,
                user.student_number,
                user.user_tickets?.[0]?.user_ticket_detail?.article_title || '-',
                user.user_tickets?.[0]?.user_ticket_detail?.article_revision_status || 'pending',
                user.user_tickets?.[0]?.user_ticket_detail?.article_url || '-',
                user.user_tickets?.[0]?.user_ticket_detail?.article_revision_evidence_url || '-'
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
        link.download = `review_jurnal_${dateStr}.csv`;
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
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-lg sm:text-xl font-bold text-gray-800">Review Artikel</h1>
                                    <p className="text-xs sm:text-sm text-gray-600">
                                        Total: {filteredUsers.length} artikel
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
                                    placeholder="Cari nama, NIM, atau judul artikel..."
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
                                <option value="waiting">Menunggu Review</option>
                                <option value="approved">Disetujui</option>
                                <option value="revise">Perlu Revisi</option>
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
                                <p className="text-gray-600 text-sm">Memuat data artikel...</p>
                            </div>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-16">
                            <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg font-medium">Tidak ada artikel ditemukan</p>
                            <p className="text-gray-400 text-sm mt-1">
                                {searchQuery ? 'Coba ubah kata kunci pencarian' : 'Belum ada artikel yang perlu direview'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Nama</TableHead>
                                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">NIM</TableHead>
                                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Judul Artikel</TableHead>
                                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">File Artikel</TableHead>
                                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Bukti Revisi</TableHead>
                                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Status</TableHead>
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
                                                <TableCell className="text-xs sm:text-sm text-gray-700 max-w-xs">
                                                    <div className="truncate" title={detail?.article_title || '-'}
                                                    >
                                                        {detail?.article_title || '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm">
                                                    {detail?.article_url ? (
                                                        <a 
                                                            href={detail.article_url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
                                                        >
                                                            <Eye className="w-3 h-3" />
                                                            <span className="truncate max-w-[150px]">
                                                                {truncateFileName(detail.article_path || 'Lihat File')}
                                                            </span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm">
                                                    {detail?.article_revision_evidence_url ? (
                                                        <a 
                                                            href={detail.article_revision_evidence_url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
                                                        >
                                                            <Eye className="w-3 h-3" />
                                                            <span className="truncate max-w-[150px]">
                                                                {truncateFileName(detail.article_revision_evidence_path || 'Lihat Bukti')}
                                                            </span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </TableCell>
                                                
                                                                                                    <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                                                                                                        {getStatusBadge(detail)}
                                                                                                    </TableCell>
                                                
                                                <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                                                    <div className="flex gap-2">
                                                        <Button 
                                                            size="sm" 
                                                            className="bg-green-500 hover:bg-green-600 text-white text-xs" 
                                                            onClick={() => detail && handleApprove(detail.id, user.name)}
                                                            disabled={!detail || detail.article_revision_status === 'approved' || (detail.article_revision_status === 'revise' && !detail.article_revision_evidence_url)}
                                                        >
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Setuju
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            className="bg-red-500 hover:bg-red-600 text-white text-xs" 
                                                            onClick={() => detail && handleReject(detail.id, user.name)}
                                                            disabled={!detail || detail.article_revision_status === 'approved' || (detail.article_revision_status === 'revise' && !detail.article_revision_evidence_url)}
                                                        >
                                                            <XCircle className="w-3 h-3 mr-1" />
                                                            Tolak
                                                        </Button>
                                                    </div>
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