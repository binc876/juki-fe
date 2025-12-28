'use client'

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { 
    Users, 
    Calendar, 
    FileText, 
    AlertTriangle, 
    CheckCircle, 
    AlertCircle,
    TrendingUp,
    Clock,
    MessageSquare
} from 'lucide-react';

interface User {
    id: number;
    user_tickets: {
        id: number;
        approved_by_admin_at: string | null;
        training_schedule_id: number | null;
        user_ticket_detail: {
            id: number;
            article_path: string | null;
            article_revision_status: string | null;
            loa_url: string | null;
            payment_evidence_path: string | null;
            statement_letter_path: string | null;
        } | null;
    }[];
}

interface TrainingSchedule {
    id: number;
    started_at: string;
}

interface LiabilityFree {
    id: number;
    is_accepted_by_admin: number | null;
}

interface Feedback {
    id: number;
}

interface StatCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    bgColor: string;
    iconColor: string;
    trend?: string;
}

const StatCard = ({ title, value, icon, bgColor, iconColor, trend }: StatCardProps) => (
    <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:scale-[1.02]">
        <div className="flex items-start justify-between mb-3">
            <div className={`p-2.5 sm:p-3 ${bgColor} rounded-lg ${iconColor} flex-shrink-0`}>
                {icon}
            </div>
            {trend && (
                <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <TrendingUp size={12} />
                    {trend}
                </div>
            )}
        </div>
        <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-1 line-clamp-2">
            {title}
        </h3>
        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
            {value}
        </p>
    </div>
);

export default function DashboardOverview() {
    const [totalParticipants, setTotalParticipants] = useState(0);
    const [upcomingSchedules, setUpcomingSchedules] = useState(0);
    const [pendingJournalReviews, setPendingJournalReviews] = useState(0);
    const [pendingVerifications, setPendingVerifications] = useState(0);
    const [pendingLoaApprovals, setPendingLoaApprovals] = useState(0);
    const [pendingBebasTanggungan, setPendingBebasTanggungan] = useState(0);
    const [totalFeedbacks, setTotalFeedbacks] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [usersResponse, schedulesResponse, liabilityFreesResponse, feedbacksResponse] = await Promise.all([
                    api.get('/users'),
                    api.get('/admin/training-schedules'),
                    api.get('/liability-frees'),
                    api.get('/feedbacks'),
                ]);

                const users: User[] = usersResponse.data.data || [];
                const schedules: TrainingSchedule[] = schedulesResponse.data.data || [];
                const liabilityFrees: LiabilityFree[] = liabilityFreesResponse.data.data || [];
                const feedbacks: Feedback[] = feedbacksResponse.data.data || [];

                // Total Participants
                setTotalParticipants(usersResponse.data.meta.total || users.length);

                // Upcoming Training Schedules
                const now = new Date();
                const upcoming = schedules.filter(s => new Date(s.started_at) > now);
                setUpcomingSchedules(upcoming.length);

                // Pending Journal Reviews
                const pendingJournals = users.filter(user => 
                    user.user_tickets && user.user_tickets.length > 0 && 
                    user.user_tickets[0].user_ticket_detail?.article_path && 
                    user.user_tickets[0].user_ticket_detail?.article_revision_status === null
                );
                setPendingJournalReviews(pendingJournals.length);

                // Pending Verifications
                const pendingVerificationsCount = users.filter(user => 
                    user.user_tickets && user.user_tickets.length > 0 && 
                    user.user_tickets[0].user_ticket_detail?.payment_evidence_path &&
                    user.user_tickets[0].user_ticket_detail?.statement_letter_path &&
                    !user.user_tickets[0].approved_by_admin_at
                );
                setPendingVerifications(pendingVerificationsCount.length);

                // Pending LOA Approvals
                const pendingLoa = users.filter(user => 
                    user.user_tickets && user.user_tickets.length > 0 && 
                    user.user_tickets[0].user_ticket_detail?.loa_url && 
                    !user.user_tickets[0].approved_by_admin_at
                );
                setPendingLoaApprovals(pendingLoa.length);

                // Pending Bebas Tanggungan
                const pendingBebas = liabilityFrees.filter(lf => lf.is_accepted_by_admin === null);
                setPendingBebasTanggungan(pendingBebas.length);

                // Total Feedbacks
                setTotalFeedbacks(feedbacksResponse.data.meta.total || feedbacks.length);


            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
                setError("Gagal memuat data dashboard. Silakan refresh halaman.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-[#5C7B78] mx-auto mb-4"></div>
                            <p className="text-gray-600 text-sm sm:text-base">Memuat data dashboard...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6 flex items-start gap-3">
                        <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={24} />
                        <div>
                            <h3 className="text-red-800 font-semibold text-sm sm:text-base mb-1">Error</h3>
                            <p className="text-red-600 text-xs sm:text-sm">{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const stats = [
        {
            title: 'Total Peserta Terdaftar',
            value: totalParticipants,
            icon: <Users className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />,
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600',
        },
        {
            title: 'Jadwal Pelatihan Mendatang',
            value: upcomingSchedules,
            icon: <Calendar className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />,
            bgColor: 'bg-purple-50',
            iconColor: 'text-purple-600',
        },
        {
            title: 'Review Artikel Tertunda',
            value: pendingJournalReviews,
            icon: <FileText className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />,
            bgColor: 'bg-yellow-50',
            iconColor: 'text-yellow-600',
        },
        {
            title: 'Verifikasi Pendaftaran Tertunda',
            value: pendingVerifications,
            icon: <Clock className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />,
            bgColor: 'bg-orange-50',
            iconColor: 'text-orange-600',
        },
        {
            title: 'Persetujuan LOA Tertunda',
            value: pendingLoaApprovals,
            icon: <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />,
            bgColor: 'bg-green-50',
            iconColor: 'text-green-600',
        },
        {
            title: 'Bebas Tanggungan Tertunda',
            value: pendingBebasTanggungan,
            icon: <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />,
            bgColor: 'bg-red-50',
            iconColor: 'text-red-600',
        },
        {
            title: 'Total Feedback Masuk',
            value: totalFeedbacks,
            icon: <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />,
            bgColor: 'bg-indigo-50',
            iconColor: 'text-indigo-600',
        },
    ];

    const totalPending = pendingJournalReviews + pendingVerifications + pendingLoaApprovals + pendingBebasTanggungan;

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen pt-16 md:pt-4">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
                        Dashboard Overview
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600">
                        Selamat datang kembali! Berikut ringkasan sistem Jupalo.
                    </p>
                </div>

                {/* Alert Section - Total Pending */}
                {totalPending > 0 && (
                    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5 flex items-start gap-3">
                        <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={24} />
                        <div className="flex-1">
                            <h3 className="text-amber-800 font-semibold text-sm sm:text-base mb-1">
                                Perhatian!
                            </h3>
                            <p className="text-amber-700 text-xs sm:text-sm">
                                Terdapat <span className="font-bold">{totalPending} item</span> yang memerlukan tindakan Anda.
                            </p>
                        </div>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                    {stats.map((stat, index) => (
                        <StatCard key={index} {...stat} />
                    ))}
                </div>

                {/* Footer Info */}
                <div className="mt-8 sm:mt-10 pt-6 border-t border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-500 text-center">
                        Data terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                </div>
            </div>
        </div>
    );
}