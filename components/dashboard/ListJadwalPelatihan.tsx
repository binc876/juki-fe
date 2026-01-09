'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import {
  CalendarDays,
  MapPin,
  Users,
  Clock,
  FileText,
  User,
} from 'lucide-react';

interface Training {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  location: string;
  quota: number;
  participantsCount?: number;
  mentorName?: string;
  batch?: string;
  journalCode?: string;
}

interface ListJadwalPelatihanProps {
  onRegisterClick?: () => void;
}

export default function ListJadwalPelatihan({
  onRegisterClick,
}: ListJadwalPelatihanProps) {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        const response = await api.get('/trainings');
        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        setTrainings(data);
      } catch (err) {
        console.error(err);
        setError('Gagal memuat jadwal pelatihan.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrainings();
  }, []);

  if (loading) return <div className="text-white">Memuat jadwal...</div>;
  if (error) return <div className="text-red-200">{error}</div>;
  if (trainings.length === 0)
    return <div className="text-white">Belum ada jadwal pelatihan.</div>;

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateString));

  const formatTime = (start: string, end: string) => {
    const opt: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };
    return `${new Date(start).toLocaleTimeString(
      'id-ID',
      opt
    )} - ${new Date(end).toLocaleTimeString('id-ID', opt)} WIB`;
  };

  return (
    <div className="w-full px-0 mx-0">
      {/* GRID */}
      <div className="
        grid
        grid-cols-1
        md:grid-cols-2
        lg:grid-cols-3
        gap-6
        w-full
        font-poppins
        place-items-start
      ">
        {trainings.map((training) => (
          <Card
            key={training.id}
            onClick={onRegisterClick}
            className="
              w-full
              max-w-[440px]
              h-[300px]
              bg-white
              border-2 border-gray-300
              rounded-2xl
              shadow-sm
              overflow-hidden
              p-2
              box-border
              cursor-pointer
              transition-all
              duration-300
              hover:border-[#5C7B78]
              hover:shadow-md
              group
            "
          >
            <div className="flex flex-col h-full rounded-xl overflow-hidden">

              {/* HEADER */}
              <div className="
                flex
                items-center
                gap-4
                px-5
                py-3
                h-[90px]
                bg-[#5C7B78]
                text-white
                transition-colors
                group-hover:bg-[#4a6361]
              ">
                <CalendarDays className="w-10 h-10 shrink-0" strokeWidth={2.5} />

                <div className="flex flex-col min-w-0">
                  <span className="
                    text-[11px]
                    lg:text-[12px]
                    font-medium
                    uppercase
                    tracking-wider
                    text-white/90
                    truncate
                  ">
                    {training.batch ? `${training.batch} | ` : ''}
                    {training.title}
                  </span>

                  {/* TANGGAL – 1 LINE ONLY */}
                  <h3 className="
                    text-lg
                    lg:text-[22px]
                    font-bold
                    truncate
                  ">
                    {formatDate(training.startAt)}
                  </h3>
                </div>
              </div>

              {/* BODY */}
              <CardContent className="
                flex-grow
                px-5
                py-4
                bg-white
                text-gray-700
                text-[13px]
                lg:text-[15px]
                font-medium
                flex
                flex-col
                justify-center
              ">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <MapPin className="w-5 h-5 text-[#5C7B78] shrink-0" />
                    <span className="truncate">{training.location}</span>
                  </div>

                  <div className="flex items-center gap-3 min-w-0">
                    <Clock className="w-5 h-5 text-[#5C7B78] shrink-0" />
                    <span className="truncate">
                      {formatTime(training.startAt, training.endAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-[#5C7B78] shrink-0" />
                    <span className="truncate">
                      Kelompok Jurnal :
                      <strong className="text-gray-900">
                        {' '}
                        {training.journalCode || 'JOESMENT'}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 min-w-0">
                    <User className="w-5 h-5 text-[#5C7B78] shrink-0" />
                    <span className="truncate">
                      Dosen Pembimbing :
                      <span className="text-gray-900">
                        {' '}
                        {training.mentorName || 'Bayu Setiawan'}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-1 min-w-0">
                    <Users className="w-5 h-5 text-[#5C7B78] shrink-0" />
                    <span className="truncate">
                      Sisa Kuota :
                      <span className="text-[#D35F5F] font-bold">
                        {' '}
                        {training.quota} Peserta
                      </span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
