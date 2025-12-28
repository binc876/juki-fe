'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserTicket, TrainingSchedule } from "@/lib/types"
import { api } from "@/lib/api"
import { isAxiosError } from "axios"
import { Loader2, Calendar, MapPin, User, Users, CheckCircle, AlertCircle, RefreshCw, Clock } from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

interface IkutPelatihanSectionProps {
  activeTicket: UserTicket | null;
  onHadir: () => void;
}

export default function IkutPelatihanSection({ activeTicket, onHadir: onUpdate }: IkutPelatihanSectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [availableSchedules, setAvailableSchedules] = useState<TrainingSchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);

  if (!activeTicket || !activeTicket.user_ticket_detail?.article_path) {
    return null;
  }

  const formatTanggalIndo = (startDateString: string, endDateString: string) => {
    if (!startDateString || !endDateString) return { startDate: 'Tanggal tidak valid', endDate: '' };
    const startDate = new Date(startDateString);
    const endDate = new Date(endDateString);

    const formatOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };

    return {
      startDate: new Intl.DateTimeFormat('id-ID', formatOptions).format(startDate),
      endDate: new Intl.DateTimeFormat('id-ID', formatOptions).format(endDate)
    };
  };

  const presence = activeTicket?.presence;
  let hasAttended = false;
  if (presence) {
    if (Array.isArray(presence)) {
      hasAttended = presence.length > 0 && presence.some(p => p.attended_at !== null);
    } else {
      hasAttended = (presence as { attended_at: string | null }).attended_at !== null;
    }
  }
  const isPastSchedule = activeTicket?.training_schedule && new Date(activeTicket.training_schedule.started_at) < new Date();
  const canReschedule = isPastSchedule && !hasAttended;

  const handleFetchSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      // Assuming this endpoint provides available schedules
      const response = await api.get('/training-schedules');
      const filteredSchedules = (response.data.data || []).filter((s: TrainingSchedule) => new Date(s.started_at) > new Date() && s.current_quota < s.quota);
      setAvailableSchedules(filteredSchedules);
      setIsRescheduling(true);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || "Gagal memuat jadwal yang tersedia.");
      } else {
        setError("Gagal memuat jadwal yang tersedia.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!selectedSchedule) {
      setError("Silakan pilih jadwal baru.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Create URLSearchParams for application/x-www-form-urlencoded format
      const params = new URLSearchParams();
      params.append('training_schedule_id', selectedSchedule);

      await api.put(`/user-tickets/${activeTicket.id}/update-training-schedule`, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
      });

      // Reset reschedule state
      setIsRescheduling(false);
      setSelectedSchedule(null);
      setAvailableSchedules([]);

      onUpdate();
    } catch (err: unknown) {
      console.error('Reschedule error:', err);

      if (isAxiosError(err)) {
        // Better error handling
        if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else if (err.response?.data?.errors) {
          // Handle validation errors
          const errors = Object.values(err.response.data.errors).flat();
          setError(errors.join(', '));
        } else {
          setError("Gagal memperbarui jadwal. Silakan coba lagi.");
        }
      } else {
        setError("Gagal memperbarui jadwal. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 1. Attended View (Success)
  if (hasAttended) {
    return (
      <div className="text-center mt-16 animate-fade-in-up">
        <div className="max-w-md mx-auto">
          {/* Success Icon with Animation */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-pulse"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Success Message */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-xl">
            <h2 className="text-3xl font-bold text-white mb-4">
              Selamat! 🎉
            </h2>
            <p className="text-xl text-white/90 mb-2">
              Kamu Sudah Mengikuti Pelatihan
            </p>
            <p className="text-white/70 text-sm">
              Jangan lupa untuk cek status review artikelmu, ya!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Absent View (Reschedule)
  if (canReschedule) {
    return (
      <div className="max-w-4xl mx-auto mt-12 animate-fade-in-up">
        {/* Alert Message */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-lg mb-1">Tidak Hadir di Pelatihan</h3>
              <p className="text-red-100">
                Silakan lakukan reschedule untuk mengikuti pelatihan di jadwal lain
              </p>
            </div>
          </div>
        </div>

        {/* Reschedule Section */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <RefreshCw className="w-12 h-12 text-white mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Pilih Ulang Jadwal Pelatihan</h3>
            <p className="text-white/70">Pilih jadwal baru yang sesuai dengan waktu Anda</p>
          </div>

          {error && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-200 px-4 py-3 rounded-lg mb-6 text-center">
              {error}
            </div>
          )}

          {/* Initial button to fetch schedules */}
          {!isRescheduling && (
            <div className="text-center">
              <Button
                onClick={handleFetchSchedules}
                disabled={loading}
                className="bg-white text-[#5C7B78] hover:bg-gray-100 px-8 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5 mr-2" />
                    Memuat...
                  </>
                ) : (
                  <>
                    <Calendar className="w-5 h-5 mr-2" />
                    Lihat Jadwal Tersedia
                  </>
                )}
              </Button>
            </div>
          )}

          {/* List of schedules and update button */}
          {isRescheduling && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {availableSchedules.length > 0 ? availableSchedules.map(schedule => (
                  <Card
                    key={schedule.id}
                    onClick={() => setSelectedSchedule(String(schedule.id))}
                    className={`cursor-pointer transition-all duration-300 hover:scale-105 ${selectedSchedule === String(schedule.id)
                      ? 'bg-white text-[#5C7B78] border-2 border-white shadow-xl'
                      : 'bg-white/10 text-white border-2 border-white/30 hover:bg-white/20'
                      }`}
                  >
                    <CardContent className="p-6">
                      <div className="text-center space-y-2">
                        <Calendar className={`w-8 h-8 mx-auto ${selectedSchedule === String(schedule.id) ? 'text-[#5C7B78]' : 'text-white'}`} />
                        <h4 className="font-bold text-lg leading-tight">
                          {formatTanggalIndo(schedule.started_at, schedule.ended_at).startDate}
                        </h4>
                        <div className="flex items-center justify-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {(() => {
                              const start = new Date(schedule.started_at);
                              const end = new Date(schedule.ended_at);
                              const formattedTime = start.toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              });
                              const formattedEndTime = end.toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              });
                              return `${formattedTime} - ${formattedEndTime} WIB`;
                            })()}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{schedule.location}</span>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <User className="w-4 h-4" />
                            <span>Dosbing: {schedule.lecturer}</span>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>Sisa {schedule.quota - schedule.current_quota} peserta</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <div className="col-span-full text-center py-12">
                    <Calendar className="w-16 h-16 text-white/50 mx-auto mb-4" />
                    <p className="text-white/70 text-lg">Tidak ada jadwal lain yang tersedia saat ini</p>
                  </div>
                )}
              </div>

              {availableSchedules.length > 0 && (
                <div className="text-center">
                  <Button
                    onClick={handleRescheduleSubmit}
                    disabled={loading || !selectedSchedule}
                    className="bg-white text-[#5C7B78] hover:bg-gray-100 px-8 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin w-5 h-5 mr-2" />
                        Memperbarui...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Update Jadwal
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. Default View (Waiting for Training)
  return (
    <div className="max-w-2xl mx-auto mt-12 animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-white">Kamu Terdaftar di Batch Pelatihan Ini!</h2>
      </div>

      {/* Training Details Card */}
      <div className="bg-gradient-to-br from-white to-gray-50 text-[#5C7B78] rounded-3xl p-8 shadow-2xl border border-white/20">
        <div className="bg-white text-[#5C7B78] px-6 py-5 rounded-xl space-y-2">
          <p className="text-sm tracking-wide font-medium">{activeTicket.training_schedule?.batch_number}</p>
          <h1 className="text-2xl font-bold text-[#5C7B78]">{formatTanggalIndo(activeTicket.training_schedule?.started_at || '', activeTicket.training_schedule?.ended_at || '').startDate}</h1>
          <p className="text-sm">{activeTicket.training_schedule?.subtitle}</p>

          <div className="flex items-center justify-between mt-4">
            <span className="text-[#D15651] font-bold text-2xl">{activeTicket.training_schedule?.location || 'Online'}</span>
            <span className="bg-[#5C7B78] text-white px-4 py-1.5 rounded-lg text-xl font-bold">
              {(() => {
                const start = new Date(activeTicket.training_schedule?.started_at || '');
                const end = new Date(activeTicket.training_schedule?.ended_at || '');
                const formattedTime = start.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const formattedEndTime = end.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return `${formattedTime} - ${formattedEndTime} WIB`;
              })()}
            </span>
          </div>
        </div>
      </div>
      {/* Info Messages */}
      <div className="mt-8 space-y-4">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center">
          <p className="text-white/90 text-sm">
            ⏰ Pastikan kamu hadir tepat waktu agar bisa mendapatkan validasi kehadiran dari admin
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center">
          <p className="text-sm">
            📱 Informasi lebih lanjut untuk pelatihan gabung ke
            <Link
              href="https://chat.whatsapp.com/I5K7EUTNSPyKKrUCXuwFs6?mode=wwt"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2"
            >
              <Button className="hover:bg-[#D15651] cursor-pointer">
                Group WhatsApp
              </Button>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}