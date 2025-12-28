'use client'

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, FileCheck, Filter } from 'lucide-react';

interface User {
    id: number;
    name: string;
    student_number: string;
    user_tickets: {
        id: number;
        user_ticket_detail: {
            id: number;
            article_title: string;
            loa_path: string; // Changed from loa_url
        } | null;
    }[];
}

export default function LOA() {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState<number | null>(null); // To track download state per user
    const [searchQuery, setSearchQuery] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users', {
                headers: {
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            if (response.data && response.data.data) {
                const usersWithLoa = response.data.data.filter(
                    (user: User) => user.user_tickets && user.user_tickets.length > 0 && user.user_tickets[0].user_ticket_detail?.loa_path
                );
                setUsers(usersWithLoa);
                setFilteredUsers(usersWithLoa);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
            alert('Gagal memuat data LOA. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        let filtered = users;
        if (searchQuery) {
            filtered = filtered.filter(user => 
                user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.student_number.includes(searchQuery) ||
                user.user_tickets?.[0]?.user_ticket_detail?.article_title?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        setFilteredUsers(filtered);
    }, [searchQuery, users]);

    const handleDownloadLoa = async (ticketId: number, userName: string) => {
        setDownloading(ticketId);
        try {
            const response = await api.get(`/user-tickets/${ticketId}/generate-loa`, {
                responseType: 'blob',
                headers: {
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            
            const contentDisposition = response.headers['content-disposition'];
            let filename = `LOA_${userName.replace(/ /g, '_')}.pdf`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch && filenameMatch.length > 1) {
                    filename = filenameMatch[1];
                }
            }

            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();

            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Gagal mengunduh LOA:", error);
            alert("Gagal mengunduh LOA. Silakan coba lagi.");
        } finally {
            setDownloading(null);
        }
    };

    const handleExportCSV = () => {
        if (!filteredUsers || filteredUsers.length === 0) {
            alert("Tidak ada data LOA untuk diekspor.");
            return;
        }

        const csvContent = [
            ["No", "Nama", "NIM", "Judul Artikel"],
            ...filteredUsers.map((user, index) => [
                (index + 1).toString(),
                user.name,
                user.student_number,
                user.user_tickets?.[0]?.user_ticket_detail?.article_title || '-',
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
        link.download = `loa_data_${dateStr}.csv`;
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
                                    <FileCheck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-lg sm:text-xl font-bold text-gray-800">Letter of Acceptance (LOA)</h1>
                                    <p className="text-xs sm:text-sm text-gray-600">
                                        Total: {filteredUsers.length} dokumen LOA
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

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Cari nama, NIM, atau judul artikel..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 w-full text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5C7B78] mx-auto mb-4"></div>
                                <p className="text-gray-600 text-sm">Memuat data LOA...</p>
                            </div>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-16">
                            <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg font-medium">Tidak ada dokumen LOA ditemukan</p>
                            <p className="text-gray-400 text-sm mt-1">
                                {searchQuery ? 'Coba ubah kata kunci pencarian' : 'Belum ada dokumen LOA yang tersedia'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">No</TableHead>
                                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Nama</TableHead>
                                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">NIM</TableHead>
                                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Judul Artikel</TableHead>
                                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user, index) => {
                                        const ticket = user.user_tickets?.[0];
                                        const detail = ticket?.user_ticket_detail;
                                        const ticketId = ticket?.id;
                                        
                                        return (
                                            <TableRow key={user.id} className="hover:bg-gray-50 transition-colors">
                                                <TableCell className="text-xs sm:text-sm text-gray-700">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm text-gray-900 font-medium">
                                                    {user.name}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">
                                                    {user.student_number}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm text-gray-700 max-w-xs">
                                                    <div className="truncate" title={detail?.article_title || '-'}>
                                                        {detail?.article_title || '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                                                    {ticketId && (
                                                        <Button 
                                                            size="sm" 
                                                            className="bg-[#5C7B78] hover:bg-[#4a6360] text-white text-xs"
                                                            onClick={() => handleDownloadLoa(ticketId, user.name)}
                                                            disabled={downloading === ticketId}
                                                        >
                                                            <Download className="w-3 h-3 mr-1" />
                                                            {downloading === ticketId ? 'Mengunduh...' : 'Unduh LOA'}
                                                        </Button>
                                                    )}
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
