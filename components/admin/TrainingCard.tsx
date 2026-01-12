import React from 'react';
import { Calendar, MapPin, Clock, FileText, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Training {
  id: string;
  batch: string;
  title: string;
  startAt: string;
  endAt: string;
  location: string;
  journalCode: string;
  mentorName: string;
  quota: number;
  _count?: {
    flows: number; // Used to calculate remaining quota if needed, or if API provides current quota usage
  };
}

interface TrainingCardProps {
  training: Training;
  onDetail: (id: string) => void;
}

export default function TrainingCard({ training, onDetail }: TrainingCardProps) {
  // Date Formatting
  const startDate = new Date(training.startAt);
  const endDate = new Date(training.endAt);
  
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const dateStr = startDate.toLocaleDateString('id-ID', dateOptions);

  // Time Formatting
  const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
  const startTimeStr = startDate.toLocaleTimeString('id-ID', timeOptions).replace('.', ':');
  const endTimeStr = endDate.toLocaleTimeString('id-ID', timeOptions).replace('.', ':');
  const timeZone = 'WIB'; // Assuming WIB based on design, or extract from date if possible

  // Calculate Remaining Quota (This depends on how backend sends data. 
  // If `quota` is total and `_count.flows` is used, then remaining = quota - flows.
  // If `quota` is already remaining, then just use it. 
  // Based on "Sisa Kuota : 15 Peserta" in design, and likely behavior, 
  // let's assume `quota` is total cap and `_count.flows` is registered users.)
  const used = training._count?.flows || 0;
  const remaining = Math.max(0, training.quota - used);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="bg-[#6B8E88] text-white p-4">
         <div className="text-[10px] uppercase font-bold tracking-wider opacity-90 mb-0.5">
            {training.batch} | {training.title}
         </div>
         <div className="flex items-center gap-2 font-bold text-lg">
            <Calendar className="w-5 h-5" />
            <span>{dateStr}</span>
         </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-3 text-sm text-gray-700">
        <div className="flex items-start gap-3">
           <MapPin className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" />
           <span className="font-medium">{training.location}</span>
        </div>
        <div className="flex items-center gap-3">
           <Clock className="w-4 h-4 text-gray-500 shrink-0" />
           <span className="font-medium">{startTimeStr} - {endTimeStr} {timeZone}</span>
        </div>
        <div className="flex items-center gap-3">
           <FileText className="w-4 h-4 text-gray-500 shrink-0" />
           <span className="font-medium">Kelompok Jurnal : <span className="font-bold">{training.journalCode}</span></span>
        </div>
        <div className="flex items-center gap-3">
           <User className="w-4 h-4 text-gray-500 shrink-0" />
           <span className="font-medium">Dosen Pembimbing : {training.mentorName}</span>
        </div>
        <div className="flex items-center gap-3">
           <Users className="w-4 h-4 text-gray-500 shrink-0" />
           <span className="font-medium">Sisa Kuota : <span className="text-[#D15651] font-bold">{remaining} Peserta</span></span>
        </div>

        {/* Footer Action */}
        <div className="pt-2 flex justify-end">
           <Button 
             onClick={() => onDetail(training.id)}
             className="bg-[#6B8E88] hover:bg-[#5a7872] text-white text-xs px-6 h-8 rounded-lg"
           >
             Lihat Detail
           </Button>
        </div>
      </div>
    </div>
  );
}
