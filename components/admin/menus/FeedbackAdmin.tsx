'use client'

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    MessageSquare,
    Search,
    Download,
    Filter,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Mail,
    Phone,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface User {
    id: number;
    name: string;
    student_number: string;
    email: string;
    mobile_number: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
}

interface Feedback {
    id: number;
    user_id: number;
    content: string;
    created_at: string;
    updated_at: string;
    user?: User;
}

interface FeedbackResponse {
    status: number;
    message: string;
    data: Feedback[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

interface UsersResponse {
    status: number;
    message: string;
    data: User[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function FeedbackPage() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>([]);
    const [users, setUsers] = useState<Map<number, User>>(new Map());
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalFeedbacks, setTotalFeedbacks] = useState(0);
    const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

    const fetchUsers = async () => {
        try {
            const response = await api.get<UsersResponse>('/users?page=1&length=1000', {
                headers: {
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            if (response.data && response.data.data) {
                const userMap = new Map<number, User>();
                response.data.data.forEach(user => {
                    userMap.set(user.id, user);
                });
                setUsers(userMap);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (users.size > 0) {
            const fetchFeedbacks = async (page: number = 1) => {
                setLoading(true);
                try {
                    const response = await api.get<FeedbackResponse>(`/feedbacks?page=${page}`, {
                        headers: {
                            'ngrok-skip-browser-warning': 'true'
                        }
                    });
                    if (response.data && response.data.data) {
                        const feedbacksWithUsers = response.data.data.map(feedback => ({
                            ...feedback,
                            user: users.get(feedback.user_id)
                        }));
                        setFeedbacks(feedbacksWithUsers);
                        setFilteredFeedbacks(feedbacksWithUsers);
                        setCurrentPage(response.data.meta.current_page);
                        setTotalPages(response.data.meta.last_page);
                        setTotalFeedbacks(response.data.meta.total);
                    }
                } catch (error) {
                    console.error("Failed to fetch feedbacks:", error);
                    alert('Gagal memuat data feedback. Silakan coba lagi.');
                } finally {
                    setLoading(false);
                }
            };

            fetchFeedbacks(currentPage);
        }
    }, [currentPage, users]);

    useEffect(() => {
        let filtered = feedbacks;

        if (searchQuery) {
            filtered = filtered.filter(feedback =>
                feedback.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                feedback.user_id.toString().includes(searchQuery) ||
                feedback.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                feedback.user?.student_number.includes(searchQuery) ||
                feedback.user?.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredFeedbacks(filtered);
    }, [searchQuery, feedbacks]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const normalizeWhatsApp = (number: string | null) => {
        if (!number) return '-';
        if (number.startsWith('0')) {
            return `+62${number.substring(1)}`;
        }
        if (number.startsWith('62')) {
            return `+${number}`;
        }
        return number;
    };

    const handleExportCSV = () => {
        if (!filteredFeedbacks || filteredFeedbacks.length === 0) {
            alert("Tidak ada data feedback untuk diekspor.");
            return;
        }

        const csvContent = [
            ["No", "Nama", "NIM", "Email", "WhatsApp", "Feedback", "Tanggal Dibuat"],
            ...filteredFeedbacks.map((feedback, index) => [
                (index + 1).toString(),
                feedback.user?.name || '-',
                feedback.user?.student_number || '-',
                feedback.user?.email || '-',
                feedback.user ? normalizeWhatsApp(feedback.user.mobile_number) : '-',
                feedback.content,
                formatDate(feedback.created_at)
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
        link.download = `feedback_${dateStr}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
                    <div className="flex flex-col gap-3 sm:gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 truncate">
                                        Feedback Peserta
                                    </h1>
                                    <p className="text-xs sm:text-sm text-gray-600">
                                        Total: {totalFeedbacks} feedback
                                    </p>
                                </div>
                            </div>

                            <Button
                                onClick={handleExportCSV}
                                variant="outline"
                                className="text-[#5C7B78] border-[#5C7B78] hover:bg-[#5C7B78] hover:text-white w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10"
                            >
                                <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                Export CSV
                            </Button>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <Input
                                placeholder="Cari nama, NIM, email, atau feedback..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8 sm:pl-10 w-full text-xs sm:text-sm h-9 sm:h-10"
                            />
                        </div>
                    </div>
                </div>

                {/* Table Section - Desktop */}
                <div className="hidden lg:block bg-white rounded-xl shadow-sm border overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5C7B78] mx-auto mb-4"></div>
                                <p className="text-gray-600 text-sm">Memuat data feedback...</p>
                            </div>
                        </div>
                    ) : filteredFeedbacks.length === 0 ? (
                        <div className="text-center py-16">
                            <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg font-medium">Tidak ada feedback ditemukan</p>
                            <p className="text-gray-400 text-sm mt-1">
                                {searchQuery ? 'Coba ubah kata kunci pencarian' : 'Belum ada feedback yang tersedia'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50">
                                            <TableHead className="font-semibold text-gray-700 text-sm whitespace-nowrap">No</TableHead>
                                            <TableHead className="font-semibold text-gray-700 text-sm whitespace-nowrap">Peserta</TableHead>
                                            <TableHead className="font-semibold text-gray-700 text-sm whitespace-nowrap">Kontak</TableHead>
                                            <TableHead className="font-semibold text-gray-700 text-sm whitespace-nowrap">Feedback</TableHead>
                                            <TableHead className="font-semibold text-gray-700 text-sm whitespace-nowrap">Tanggal</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredFeedbacks.map((feedback, index) => {
                                            const globalIndex = (currentPage - 1) * 10 + index + 1;
                                            const user = feedback.user;

                                            return (
                                                <TableRow key={feedback.id} className="hover:bg-gray-50 transition-colors">
                                                    <TableCell className="text-sm text-gray-700">
                                                        {globalIndex}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-gray-700">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                                                {user ? getInitials(user.name) : '?'}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-medium text-gray-900 truncate">
                                                                    {user?.name || 'Unknown User'}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    NIM: {user?.student_number || '-'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-gray-700">
                                                        {user ? (
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                                    <span className="truncate max-w-[200px]" title={user.email}>
                                                                        {user.email}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                                    <span>{normalizeWhatsApp(user.mobile_number)}</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-gray-700 max-w-md">
                                                        <div
                                                            className="p-2 bg-gray-50 rounded-lg border break-words cursor-pointer hover:bg-gray-100 transition-colors"
                                                            onClick={() => setSelectedFeedback(feedback)}
                                                        >
                                                            <p className="whitespace-pre-line break-words line-clamp-3">
                                                                {feedback.content}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-gray-700 whitespace-nowrap">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                            <span>{formatDate(feedback.created_at)}</span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination Desktop */}
                            {totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-gray-50">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <span>Halaman {currentPage} dari {totalPages}</span>
                                        <span className="text-gray-400">•</span>
                                        <span>Total {totalFeedbacks} feedback</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handlePreviousPage}
                                            disabled={currentPage === 1}
                                            className="text-xs"
                                        >
                                            <ChevronLeft className="w-4 h-4 mr-1" />
                                            Sebelumnya
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleNextPage}
                                            disabled={currentPage === totalPages}
                                            className="text-xs"
                                        >
                                            Selanjutnya
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Card View - Mobile & Tablet */}
                <div className="lg:hidden space-y-3 sm:space-y-4">
                    {loading ? (
                        <div className="bg-white rounded-lg shadow-sm border p-8 flex items-center justify-center">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#5C7B78] mx-auto mb-3"></div>
                                <p className="text-gray-600 text-xs sm:text-sm">Memuat data feedback...</p>
                            </div>
                        </div>
                    ) : filteredFeedbacks.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                            <Filter className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-base sm:text-lg font-medium">Tidak ada feedback ditemukan</p>
                            <p className="text-gray-400 text-xs sm:text-sm mt-1">
                                {searchQuery ? 'Coba ubah kata kunci pencarian' : 'Belum ada feedback yang tersedia'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {filteredFeedbacks.map((feedback, index) => {
                                const globalIndex = (currentPage - 1) * 10 + index + 1;
                                const user = feedback.user;

                                return (
                                    <div key={feedback.id} className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 hover:shadow-md transition-shadow">
                                        {/* Header Card */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                                    {user ? getInitials(user.name) : '?'}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                                        {user?.name || 'Unknown User'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        NIM: {user?.student_number || '-'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium flex-shrink-0">
                                                #{globalIndex}
                                            </div>
                                        </div>

                                        {/* Contact Info */}
                                        {user && (
                                            <div className="space-y-1.5 mb-3 pb-3 border-b">
                                                <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                                                    <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                    <span className="text-gray-600 truncate" title={user.email}>
                                                        {user.email}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                                                    <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                    <span className="text-gray-600">
                                                        {normalizeWhatsApp(user.mobile_number)}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Feedback Content */}
                                        <div 
                                            className="mb-3 cursor-pointer"
                                            onClick={() => setSelectedFeedback(feedback)}
                                        >
                                            <p className="text-xs text-gray-500 mb-1.5 font-medium">Feedback:</p>
                                            <div className="p-2 sm:p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                                                <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-line break-words line-clamp-3">
                                                    {feedback.content}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Date */}
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <Calendar className="w-3 h-3" />
                                            <span>{formatDate(feedback.created_at)}</span>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Pagination Mobile */}
                            {totalPages > 1 && (
                                <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
                                    <div className="flex flex-col gap-3">
                                        <div className="text-center text-xs sm:text-sm text-gray-600">
                                            <span>Halaman {currentPage} dari {totalPages}</span>
                                            <span className="mx-2">•</span>
                                            <span>Total {totalFeedbacks} feedback</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handlePreviousPage}
                                                disabled={currentPage === 1}
                                                className="flex-1 text-xs h-9"
                                            >
                                                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                                Sebelumnya
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleNextPage}
                                                disabled={currentPage === totalPages}
                                                className="flex-1 text-xs h-9"
                                            >
                                                Selanjutnya
                                                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Modal Detail Feedback - Responsive */}
                {selectedFeedback && (
                    <Dialog open={selectedFeedback !== null} onOpenChange={() => setSelectedFeedback(null)}>
                        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[90vw] md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader className="space-y-3 pb-3 sm:pb-4 border-b">
                                <DialogTitle className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                                    Detail Feedback
                                </DialogTitle>
                                
                                {/* User Info in Modal */}
                                {selectedFeedback.user && (
                                    <div className="flex items-center gap-2 sm:gap-3 pt-2">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                            {getInitials(selectedFeedback.user.name)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-gray-900 text-sm sm:text-base break-words">
                                                {selectedFeedback.user.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                NIM: {selectedFeedback.user.student_number}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </DialogHeader>
                            
                            <div className="py-3 sm:py-4 space-y-3 sm:space-y-4">
                                {/* Contact Info */}
                                {selectedFeedback.user && (
                                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2">
                                        <p className="text-xs font-semibold text-gray-700 mb-2">Informasi Kontak:</p>
                                        <div className="flex items-start gap-2 text-xs sm:text-sm">
                                            <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                            <span className="text-gray-600 break-all flex-1">
                                                {selectedFeedback.user.email}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                                            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-600">
                                                {normalizeWhatsApp(selectedFeedback.user.mobile_number)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Feedback Content */}
                                <div>
                                    <p className="text-xs font-semibold text-gray-700 mb-2">Feedback:</p>
                                    <div className="bg-white border rounded-lg p-3 sm:p-4 max-h-[40vh] overflow-y-auto">
                                        <p className="text-xs sm:text-sm md:text-base text-gray-700 whitespace-pre-line break-words leading-relaxed">
                                            {selectedFeedback.content}
                                        </p>
                                    </div>
                                </div>

                                {/* Date */}
                                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 pt-2 border-t">
                                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    <span>{formatDate(selectedFeedback.created_at)}</span>
                                </div>
                            </div>

                            {/* Close Button */}
                            <div className="flex justify-end pt-2 sm:pt-3 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedFeedback(null)}
                                    className="text-xs sm:text-sm h-8 sm:h-9"
                                >
                                    <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                                    Tutup
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </div>
    );
}