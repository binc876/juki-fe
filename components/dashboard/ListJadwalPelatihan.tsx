'use client';

import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '@/lib/api';
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
  const [allTrainings, setAllTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination State
  const [trainingMeta, setTrainingMeta] = useState({ page: 1, limit: 3, total: 0, totalPage: 1 });
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        const response = await api.get('/trainings');
        const list = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        
        setAllTrainings(list);
        setTrainingMeta({ 
            page: 1, 
            limit: 3, 
            total: list.length, 
            totalPage: Math.ceil(list.length / 3) 
        });

      } catch (err) {
        console.error(err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchTrainings();
  }, []);

  // Helper chunk array
  const chunkArray = (arr: any[], size: number) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  // Create pages from allTrainings
  const pages = chunkArray(allTrainings, 3); // 3 items per page

  // Auto-slide effect
  useEffect(() => {
    if (allTrainings.length <= 3 || isPaused) return; 

    const interval = setInterval(() => {
        setTrainingMeta(prev => {
            const nextPage = prev.page >= prev.totalPage ? 1 : prev.page + 1;
            return { ...prev, page: nextPage };
        });
    }, 5000); 

    return () => clearInterval(interval);
  }, [allTrainings.length, trainingMeta.totalPage, isPaused]);

  // Handle manual page change
  const handlePageChange = (newPage: number) => {
      setTrainingMeta(prev => ({ ...prev, page: newPage }));
  }

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

  if (loading) return <div className="text-white">Memuat jadwal...</div>;
  if (error) return <div className="text-red-200">{error}</div>;
  if (allTrainings.length === 0)
    return <div className="text-white">Belum ada jadwal pelatihan.</div>;

  return (
    <div className="w-full px-0 mx-0 flex flex-col items-center">
      <div 
        className="w-full overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
          <div 
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${(trainingMeta.page - 1) * 100}%)` }}
          >
              {pages.map((pageItems, i) => (
                  <div key={i} className="w-full shrink-0 px-1">
                      {/* Mobile: Horizontal Scroll */}
                      <div className="md:hidden overflow-x-auto scrollbar-hide">
                        <div className="flex gap-4 px-4 pb-4">
                          {pageItems.map((training) => (
                              <Card
                                key={training.id}
                                onClick={onRegisterClick}
                                className="
                                  w-[85vw]
                                  min-w-[280px]
                                  max-w-[340px]
                                  min-h-[280px]
                                  bg-white
                                  border-2 border-gray-300
                                  rounded-xl
                                  shadow-sm
                                  overflow-hidden
                                  p-1.5
                                  box-border
                                  cursor-pointer
                                  transition-all
                                  duration-300
                                  hover:border-[#5C7B78]
                                  hover:shadow-md
                                  group
                                  shrink-0
                                "
                              >
                                <div className="flex flex-col h-full rounded-lg overflow-hidden">
                                  {/* HEADER */}
                                  <div className="
                                    flex
                                    items-center
                                    gap-2
                                    px-3
                                    py-2.5
                                    h-[80px]
                                    bg-[#5C7B78]
                                    text-white
                                    transition-colors
                                    group-hover:bg-[#4a6361]
                                    text-left
                                  ">
                                    <CalendarDays className="w-8 h-8 shrink-0" strokeWidth={2.5} />
                                    <div className="flex flex-col min-w-0 flex-1">
                                      <span className="
                                        text-[9px]
                                        font-medium
                                        uppercase
                                        tracking-wider
                                        text-white/90
                                        truncate
                                      ">
                                        {training.batch ? `${training.batch} | ` : ''}
                                        {training.title}
                                      </span>
                                      <h3 className="
                                        text-base
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
                                    px-3
                                    py-3
                                    bg-white
                                    text-gray-700
                                    text-xs
                                    font-medium
                                    flex
                                    flex-col
                                    justify-center
                                    text-left
                                  ">
                                    <div className="space-y-1.5">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <MapPin className="w-4 h-4 text-[#5C7B78] shrink-0" />
                                        <span className="truncate">{training.location}</span>
                                      </div>
                                      <div className="flex items-center gap-2 min-w-0">
                                        <Clock className="w-4 h-4 text-[#5C7B78] shrink-0" />
                                        <span className="truncate">
                                          {formatTime(training.startAt, training.endAt)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 min-w-0">
                                        <FileText className="w-4 h-4 text-[#5C7B78] shrink-0" />
                                        <span className="truncate">
                                          Kelompok Jurnal :
                                          <strong className="text-gray-900">
                                            {' '}
                                            {training.journalCode && ['JIE', 'JOFEI', 'JOESMENT'].includes(training.journalCode) 
                                              ? training.journalCode 
                                              : '-'}
                                          </strong>
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 min-w-0">
                                        <User className="w-4 h-4 text-[#5C7B78] shrink-0" />
                                        <span className="truncate">
                                          Dosen Pembimbing :
                                          <span className="text-gray-900">
                                            {' '}
                                            {training.mentorName || '-'}
                                          </span>
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 pt-0.5 min-w-0">
                                        <Users className="w-4 h-4 text-[#5C7B78] shrink-0" />
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

                      {/* Desktop: Grid Layout */}
                      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6 place-items-start">
                          {pageItems.map((training) => (
                              <Card
                                key={training.id}
                                onClick={onRegisterClick}
                                className="
                                  w-full
                                  max-w-full
                                  sm:max-w-[440px]
                                  min-h-[280px]
                                  sm:h-[300px]
                                  bg-white
                                  border-2 border-gray-300
                                  rounded-xl
                                  sm:rounded-2xl
                                  shadow-sm
                                  overflow-hidden
                                  p-1.5
                                  sm:p-2
                                  box-border
                                  cursor-pointer
                                  transition-all
                                  duration-300
                                  hover:border-[#5C7B78]
                                  hover:shadow-md
                                  group
                                  mx-auto
                                "
                              >
                                <div className="flex flex-col h-full rounded-lg sm:rounded-xl overflow-hidden">
                                  {/* HEADER */}
                                  <div className="
                                    flex
                                    items-center
                                    gap-2
                                    sm:gap-3
                                    md:gap-4
                                    px-3
                                    sm:px-4
                                    md:px-5
                                    py-2.5
                                    sm:py-3
                                    h-[80px]
                                    sm:h-[90px]
                                    bg-[#5C7B78]
                                    text-white
                                    transition-colors
                                    group-hover:bg-[#4a6361]
                                    text-left
                                  ">
                                    <CalendarDays className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 shrink-0" strokeWidth={2.5} />
                                    <div className="flex flex-col min-w-0 flex-1">
                                      <span className="
                                        text-[9px]
                                        sm:text-[10px]
                                        md:text-[11px]
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
                                      <h3 className="
                                        text-base
                                        sm:text-lg
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
                                    px-3
                                    sm:px-4
                                    md:px-5
                                    py-3
                                    sm:py-4
                                    bg-white
                                    text-gray-700
                                    text-xs
                                    sm:text-[13px]
                                    lg:text-[15px]
                                    font-medium
                                    flex
                                    flex-col
                                    justify-center
                                    text-left
                                  ">
                                    <div className="space-y-1.5 sm:space-y-2">
                                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#5C7B78] shrink-0" />
                                        <span className="truncate">{training.location}</span>
                                      </div>
                                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#5C7B78] shrink-0" />
                                        <span className="truncate">
                                          {formatTime(training.startAt, training.endAt)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#5C7B78] shrink-0" />
                                        <span className="truncate">
                                          Kelompok Jurnal :
                                          <strong className="text-gray-900">
                                            {' '}
                                            {training.journalCode && ['JIE', 'JOFEI', 'JOESMENT'].includes(training.journalCode) 
                                              ? training.journalCode 
                                              : '-'}
                                          </strong>
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#5C7B78] shrink-0" />
                                        <span className="truncate">
                                          Dosen Pembimbing :
                                          <span className="text-gray-900">
                                            {' '}
                                            {training.mentorName || '-'}
                                          </span>
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 sm:gap-3 pt-0.5 sm:pt-1 min-w-0">
                                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#5C7B78] shrink-0" />
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
              ))}
          </div>
      </div>

      {/* Pagination Controls (Dots) */}
      {allTrainings.length > 0 && trainingMeta.totalPage > 1 && (
         <div className="flex justify-center items-center w-full mt-8 gap-3">
             {Array.from({ length: trainingMeta.totalPage }).map((_, idx) => {
                 const pageNum = idx + 1;
                 return (
                     <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            trainingMeta.page === pageNum 
                            ? 'bg-white w-8' 
                            : 'bg-white/40 hover:bg-white/60'
                        }`}
                        aria-label={`Go to page ${pageNum}`}
                     />
                 );
             })}
         </div>
      )}
    </div>
  );
}
