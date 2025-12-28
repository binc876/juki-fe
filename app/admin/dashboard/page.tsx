'use client'

import { useState, useEffect, useCallback } from "react"
import SidebarAdmin from "@/components/admin/Sidebar"
import DashboardOverview from "@/components/admin/menus/DashboardOverview"
import { ManajemenPeserta } from "@/components/admin/menus/ManajemenPeserta"
import JadwalPelatihan from "@/components/admin/menus/JadwalPelatihan"
import ReviewJurnal from "@/components/admin/menus/ReviewJurnal"
import Verivikasi from "@/components/admin/menus/VerifikasiPage"
import LOA from "@/components/admin/menus/LOA"
import BebasTanggungan from "@/components/admin/menus/BebasTanggungan"
import NotifikasiAdmin from "@/components/admin/menus/NotifikasiAdmin"
import FeedbackAdmin from "@/components/admin/menus/FeedbackAdmin"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { api } from "@/lib/api"
import { isAxiosError } from 'axios'
import { Participant, LiabilityFree } from "@/lib/types"
import { FileText, Download, X, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Helper function untuk mendapatkan status peserta
const getParticipantStatus = (user: Participant): string => {
    if (!user.user_tickets || user.user_tickets.length === 0) {
        return "belum_punya_tiket";
    }

    const ticket = user.user_tickets[0];

    if (ticket.paid_at) {
        if (ticket.user_ticket_detail?.loa_path || ticket.user_ticket_detail?.loa_url) {
            return "sudah_pelatihan";
        }

        if (ticket.training_schedule_id) {
            return "sudah_daftar";
        }

        return "sudah_punya_tiket";
    }

    return "belum_punya_tiket";
};

// Helper function untuk render status badge
const renderStatusBadge = (status: string) => {
    switch (status) {
        case "sudah_pelatihan":
            return <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Sudah mengikuti pelatihan</span>;
        case "sudah_daftar":
            return <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">Sudah daftar pelatihan</span>;
        case "sudah_punya_tiket":
            return <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">Sudah punya tiket</span>;
        case "belum_punya_tiket":
            return <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">Belum punya tiket</span>;
        default:
            return <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">-</span>;
    }
};

export default function AdminDashboard() {
    const DocumentLink = ({ title, url }: { title: string, url: string | null | undefined }) => {
        const fileName = url ? url.split('/').pop() : null;
        return (
            <div className="space-y-2 bg-[#D9D9D9]">
                <p className="font-semibold text-gray-700 text-sm">{title}</p>
                {url ? (
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                            <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <span className="truncate text-sm text-gray-600">{fileName}</span>
                        </div>
                        <a href={url} target="_blank" rel="noopener noreferrer" download className="flex-shrink-0 ml-2">
                            <Button variant="outline" size="sm" className="bg-white hover:bg-gray-200 text-gray-700">
                                <Download className="w-4 h-4 mr-1" />
                                <span className="hidden sm:inline">Download</span>
                            </Button>
                        </a>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50 text-gray-500">
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">Dokumen belum diupload</span>
                    </div>
                )}
            </div>
        );
    };

    const [activeMenu, setActiveMenu] = useState('Dashboard')

    const columns: ColumnDef<Participant>[] = [
        {
            accessorKey: "name",
            header: "Nama",
        },
        {
            accessorKey: "student_number",
            header: "NIM",
        },
        {
            accessorKey: "email",
            header: "Email",
        },
        {
            accessorKey: "mobile_number",
            header: "WhatsApp",
        },
        {
            accessorKey: "judul_artikel",
            header: "Judul Artikel",
            cell: ({ row }) => {
                const user = row.original;
                if (user.user_tickets && user.user_tickets.length > 0 && user.user_tickets[0].user_ticket_detail) {
                    return user.user_tickets[0].user_ticket_detail.article_title || "-";
                }
                return "-";
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const user = row.original;
                const status = getParticipantStatus(user);
                return renderStatusBadge(status);
            },
        },
        {
            id: "actions",
            header: "Aksi",
            cell: ({ row }) => (
                <Button variant="outline" size="sm" onClick={() => handleShowDetail(row.original)}>
                    Lihat Detail
                </Button>
            ),
        },
    ];
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [showLogoutDialog, setShowLogoutDialog] = useState(false)
    const [pesertaData, setPesertaData] = useState<Participant[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
    const [liabilityFreesData, setLiabilityFreesData] = useState<LiabilityFree | null>(null)
    const [isLiabilityFreesLoading, setIsLiabilityFreesLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalPeserta, setTotalPeserta] = useState(0);
    const [globalFilter, setGlobalFilter] = useState("")
    const [isDownloading, setIsDownloading] = useState(false); // Renamed from downloadingLoa
    const BYPASS_LOGIN = false;

    const handleDownloadFile = async (fileUrl: string, suggestedFileName: string) => { // Renamed from handleDownloadLoa
        setIsDownloading(true); // Use generic state
        try {
            const response = await api.get(fileUrl, {
                responseType: 'blob',
                headers: {
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            const contentDisposition = response.headers['content-disposition'];
            let filename = suggestedFileName; // Use suggestedFileName
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
            console.error(`Gagal mengunduh file ${suggestedFileName}:`, error);
            alert(`Gagal mengunduh ${suggestedFileName}. Silakan coba lagi.`);
        } finally {
            setIsDownloading(false);
        }
    };

    const router = useRouter()

    const handleShowDetail = async (participant: Participant) => {
        setSelectedParticipant(participant);
        setIsDetailDialogOpen(true);
        setIsLiabilityFreesLoading(true);
        setLiabilityFreesData(null);

        try {
            const response = await api.get('/liability-frees', {
                headers: {
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            if (response.data && response.data.data) {
                const userLiabilityFrees = response.data.data.find((item: LiabilityFree) => item.user_id === participant.id);
                setLiabilityFreesData(userLiabilityFrees || null);
            }
        } catch (error) {
            console.error("Failed to fetch liability frees data:", error);
        } finally {
            setIsLiabilityFreesLoading(false);
        }
    };

    const fetchPeserta = useCallback(async (page: number, searchQuery?: string) => {
        // Skip token check in development mode
        // if (!BYPASS_LOGIN) {
        //     const token = localStorage.getItem('token')
        //     if (!token) {
        //         router.push('/login-admin')
        //         return;
        //     }
        // }

        setLoading(true);
        setError(null);

        try {
            const response = await api.get('/users', {
                params: {
                    page: page,
                    limit: 10,
                    name: searchQuery || undefined,
                },
                headers: {
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (response.data && response.data.data) {
                setPesertaData(response.data.data);
                setTotalPages(response.data.meta.last_page);
                setTotalPeserta(response.data.meta.total);
                setCurrentPage(response.data.meta.current_page);
            } else {
                setPesertaData([]);
            }

        } catch (error: unknown) {
            console.error("Failed to fetch participant data:", error);

            if (isAxiosError(error) && error.response) {
                const status = error.response.status;
                interface ErrorData {
                    message?: string;
                }
                const data: ErrorData = error.response.data;

                // if (status === 401) {
                //     if (!BYPASS_LOGIN) {
                //         return;
                //     }
                // } else if (status === 403) {
                //     setError("Akses ditolak. Silakan periksa izin Anda.");
                // } else if (status >= 500) {
                //     setError("Server error. Silakan coba lagi nanti.");
                // } else {
                //     setError(`Error: ${data && 'message' in data ? data.message : 'Unknown server error'}`);
                // }
            } else if (isAxiosError(error) && error.request) {
                setError("Network error. Periksa koneksi internet Anda.");
            } else {
                setError("Terjadi kesalahan yang tidak terduga.");
            }

            setPesertaData([]);
        } finally {
            setLoading(false);
        }
    }, [router])

    // useEffect(() => {
    //     // Skip authentication check in development mode
    //     if (BYPASS_LOGIN) {
    //         console.log("[DEV MODE] Login bypass aktif");
    //         if (activeMenu === "Manajemen Peserta") {
    //             fetchPeserta(currentPage);
    //         }
    //         return;
    //     }

    //     // Normal authentication flow
    //     const token = localStorage.getItem('token')
    //     const userString = localStorage.getItem('user')

    //     if (!token || !userString) {
    //         router.push('/login-admin')
    //         return;
    //     }

    //     try {
    //         const user = JSON.parse(userString)
    //         const isAdmin = user.roles?.some((r: { name: string; pivot?: { role_id: number } }) =>
    //             r.name === 'admin' || r.pivot?.role_id === 1
    //         )

    //         if (!isAdmin) {
    //             router.push('/login-admin')
    //             return;
    //         }

    //         if (activeMenu === "Manajemen Peserta") {
    //             fetchPeserta(currentPage);
    //         }
    //     } catch (error) {
    //         console.error("Error parsing user data:", error);
    //         router.push('/login-admin');
    //     }
    // }, [router, fetchPeserta, activeMenu, currentPage])

    useEffect(() => {
        if (activeMenu !== "Manajemen Peserta") return;

        const timeout = setTimeout(() => {
            fetchPeserta(1, globalFilter);
        }, 500); // kasih delay 0.5 detik

        return () => clearTimeout(timeout);
    }, [fetchPeserta, globalFilter, activeMenu]);

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/')
    }

    return (
        <>
            <main className="relative min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100">
                <SidebarAdmin
                    activeMenu={activeMenu}
                    onMenuChange={(menu) => {
                        if (menu === "Keluar") {
                            setShowLogoutDialog(true)
                        } else {
                            setActiveMenu(menu)
                        }
                    }}
                />

                {/* Main Content Area - Fixed responsive spacing */}
                <div className="flex-1 w-full lg:w-auto pt-16 lg:pt-0 min-w-0">
                    <div className="w-full h-full">
                        {activeMenu === "Dashboard" && <DashboardOverview />}
                        {activeMenu === "Manajemen Peserta" && (
                            <div className="w-full h-full p-3 sm:p-4 md:p-6 lg:p-8">
                                {error && (
                                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                                        <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                                        <div className="flex-1">
                                            <p className="text-sm text-red-700">{error}</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => fetchPeserta(currentPage)}
                                                className="mt-2"
                                            >
                                                Coba Lagi
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {loading && !error ? (
                                    <div className="flex items-center justify-center h-96">
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5C7B78] mx-auto mb-4"></div>
                                            <p className="text-gray-600 text-sm">Memuat data peserta...</p>
                                        </div>
                                    </div>
                                ) : (
                                    // <ManajemenPeserta
                                    //     columns={columns}
                                    //     data={pesertaData}
                                    //     currentPage={currentPage}
                                    //     totalPages={totalPages}
                                    //     totalPeserta={totalPeserta}
                                    //     onPageChange={setCurrentPage}
                                    //     // onPageChange={(page) => fetchPeserta(page, globalFilter)}
                                    // />
                                    <ManajemenPeserta
                                        columns={columns}
                                        data={pesertaData}
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        totalPeserta={totalPeserta}
                                        onPageChange={setCurrentPage}
                                        globalFilter={globalFilter}
                                        onGlobalFilterChange={(value) => setGlobalFilter(value)}
                                    />
                                )}
                            </div>
                        )}
                        {activeMenu === "Jadwal Pelatihan" && <JadwalPelatihan />}
                        {activeMenu === "Review Artikel" && <ReviewJurnal />}
                        {activeMenu === "Verifikasi" && <Verivikasi />}
                        {activeMenu === "LOA" && <LOA />}
                        {activeMenu === "Bebas Tanggungan" && <BebasTanggungan />}
                        {activeMenu === "Notifikasi" && <NotifikasiAdmin />}
                        {activeMenu === "Feedback" && <FeedbackAdmin />}
                    </div>
                </div>
            </main>

            {/* Logout Dialog */}
            <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                <DialogContent className="max-w-md rounded-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl sm:text-2xl font-bold text-[#4E6151] text-center">
                            Yakin keluar dari dashboard admin?
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
                        <Button
                            variant="outline"
                            onClick={handleLogout}
                            className="border-[#D84C4C] text-[#D84C4C] font-bold hover:bg-[#FEECEC] w-full sm:w-auto"
                        >
                            Ya, Keluar
                        </Button>
                        <Button
                            className="bg-[#5B7870] text-white hover:bg-[#4F6760] w-full sm:w-auto"
                            onClick={() => setShowLogoutDialog(false)}
                        >
                            Batal
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Detail Participant Dialog - Fixed Fullscreen */}
            {selectedParticipant && (
                <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                    <DialogContent
                        className="!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !p-0 !m-0 !border-none !rounded-none !bg-gray-50 !overflow-hidden !z-50 !translate-x-0 !translate-y-0"
                        showCloseButton={false}
                    >
                        <DialogTitle className="sr-only">Detail Data Peserta</DialogTitle>

                        {/* Full screen container */}
                        <div className="absolute inset-0 w-full h-full overflow-y-auto">
                            {/* Centered Content Wrapper */}
                            <div className="min-h-full flex flex-col">
                                {/* Fixed Header */}
                                <div className="sticky top-0 left-0 w-full bg-white z-10 border-b shadow-sm">
                                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                                        <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                                            Data Peserta
                                        </h2>
                                        <button
                                            onClick={() => setIsDetailDialogOpen(false)}
                                            className="text-gray-500 hover:text-gray-800 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                                            aria-label="Tutup"
                                        >
                                            <X className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </button>
                                    </div>
                                </div>

                                {/* Scrollable Content */}
                                <div className="flex-1 overflow-y-auto">
                                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
                                        {/* Personal Information */}
                                        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                                            <h3 className="font-bold text-lg sm:text-xl mb-4 text-gray-800 flex items-center gap-2">
                                                <div className="w-2 h-6 bg-blue-500 rounded"></div>
                                                Informasi Pribadi
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Nama Lengkap</p>
                                                        <p className="font-semibold text-gray-800">{selectedParticipant.name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">NIM</p>
                                                        <p className="font-semibold text-gray-800">{selectedParticipant.student_number}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Email</p>
                                                        <p className="font-semibold text-gray-800 break-all">{selectedParticipant.email}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">WhatsApp</p>
                                                        <p className="font-semibold text-gray-800">{selectedParticipant.mobile_number}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Judul Artikel</p>
                                                        <p className="font-semibold text-gray-800">{selectedParticipant.user_tickets?.[0]?.user_ticket_detail?.article_title || "-"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Status</p>
                                                        <p className="font-semibold text-gray-800">{(() => {
                                                            const status = getParticipantStatus(selectedParticipant);
                                                            const statusText: Record<string, string> = {
                                                                "sudah_pelatihan": "Sudah mengikuti pelatihan",
                                                                "sudah_daftar": "Sudah daftar pelatihan",
                                                                "sudah_punya_tiket": "Sudah punya tiket",
                                                                "belum_punya_tiket": "Belum punya tiket"
                                                            };
                                                            return statusText[status] || "-";
                                                        })()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Documents Section */}
                                        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                                            <h3 className="font-bold text-lg sm:text-xl mb-4 text-gray-800 flex items-center gap-2">
                                                <div className="w-2 h-6 bg-green-500 rounded"></div>
                                                Data Akun OJS
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Username</p>
                                                        <p className="font-semibold text-gray-800">{selectedParticipant.name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Password</p>
                                                        <p className="font-semibold text-gray-800">{selectedParticipant.student_number}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Kelompok Jurnal</p>
                                                        <p className="font-semibold text-gray-800">{selectedParticipant.mobile_number}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Link Artikel</p>
                                                        <p className="font-semibold text-gray-800">{selectedParticipant.user_tickets?.[0]?.user_ticket_detail?.article_title || "-"}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Thesis Documents */}
                                        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                                            <h3 className="font-bold text-lg sm:text-xl mb-4 text-gray-800 flex items-center gap-2">
                                                <div className="w-2 h-6 bg-purple-500 rounded"></div>
                                                Dokumen
                                            </h3>
                                            <div className="space-y-3">
                                                <h3 className="text-sm font-semibold text-slate-700">Dokumen</h3>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="font-semibold text-gray-800">
                                                            Bukti Pembayaran Pelatihan
                                                        </p>
                                                        <Card className="flex items-between px-3 py-2 border-dashed">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <span className="text-sm text-slate-700">
                                                                    Bukti_Pembayaran.jpeg
                                                                </span>

                                                                <Button size="sm" variant="secondary">
                                                                    Download
                                                                </Button>
                                                            </div>
                                                        </Card>
                                                    </div>

                                                    {/* LOA */}
                                                    <div>
                                                        <p className="font-semibold text-gray-800">LOA</p>

                                                        <Card className="flex items-between px-3 py-2 border-dashed">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <span className="text-sm text-slate-700">
                                                                    LOA.pdf
                                                                </span>
                                                                <Button size="sm" variant="secondary">
                                                                    Download
                                                                </Button>
                                                            </div>
                                                        </Card>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                            <DialogTrigger asChild>
                                                <div className="grid gap-2 justify-center">
                                                    <Button
                                                        className="bg-[#5C7B78] text-white font-bold hover:bg-[#9BA297] w-200 sm:w-100"
                                                    >
                                                        Edit
                                                    </Button>
                                                </div>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                                                <DialogHeader>
                                                    <DialogTitle>Edit Data Peserta</DialogTitle>
                                                </DialogHeader>
                                                <div className="grid gap-4 py-4">
                                                    <h2 className="font-semibold text-gray-800">Informasi Pribadi</h2>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="name">Nama Lengkap</Label>
                                                        <Input
                                                            id="name"
                                                            placeholder='Masukkan Nama'
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label htmlFor="nim">NIM</Label>
                                                        <Input
                                                            id="nim"
                                                            placeholder='Masukkan NIM'
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label htmlFor="email">Email</Label>
                                                        <Input
                                                            id="email"
                                                            placeholder='Masukkan Email'
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label htmlFor="whatsapp">No. WhatsApp</Label>
                                                        <Input
                                                            id="whatsapp"
                                                            placeholder='Masukkan Nomor WhatsApp'
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label htmlFor="whatsapp">Judul Artikel</Label>
                                                        <Input
                                                            id="whatsapp"
                                                            placeholder='Masukkan Judul Artikel'
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Button
                                                            className="bg-[#5C7B78] text-white font-bold hover:bg-[#9BA297] w-full sm:w-auto"
                                                        >
                                                            Reset Password
                                                        </Button>
                                                    </div>

                                                    <h2 className="font-semibold text-[#5C7B78]-800">Data Akun OJS</h2>

                                                    <div className="grid gap-2">
                                                        <Label htmlFor="username">Username</Label>
                                                        <Input
                                                            id="username"
                                                            placeholder='Masukkan Username'
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="password">Password</Label>
                                                        <Input
                                                            id="password"
                                                            placeholder='Masukkan Password'
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
                                                        <Label htmlFor="linkJurnal">Link Jurnal</Label>
                                                        <Input
                                                            id="linkJurnal"
                                                            placeholder='Link Jurnal'
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <DialogClose asChild>
                                                        <Button variant="outline">Batal</Button>
                                                    </DialogClose>
                                                    <Button className="bg-[#5C7B78] hover:bg-[#4e6a67]">
                                                        Simpan Jadwal
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}