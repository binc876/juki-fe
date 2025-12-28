'use client'

import { useState, useEffect, useCallback } from "react"
import StageTracker from "@/components/pelatihan/StageTracker"
import TiketSection from "@/components/pelatihan/stages/TiketSection"
import DaftarPelatihanSection from "@/components/pelatihan/stages/DaftarPelatihanSection"
import SubmitJurnalSection from "@/components/pelatihan/stages/SubmitJurnalSection"
import IkutPelatihanSection from "@/components/pelatihan/stages/IkutPelatihanSection"
import ReviewJurnalSection from "@/components/pelatihan/stages/ReviewJurnalSection"
import LOASection from "@/components/pelatihan/stages/LOASection"
import NavbarPeserta from "@/components/dashboard/NavbarPeserta"
import { api } from "@/lib/api"
import { AxiosError } from 'axios';

function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError).isAxiosError !== undefined;
}
import { useRouter } from "next/navigation";
import { UserTicket } from "@/lib/types"
//import PageLoader from "@/components/ui/PageLoader";
import PembayaranModal from "@/components/tiketku/PembayaranModal";

export default function PelatihankuPage() {
  console.log("[DEBUG] PelatihankuPage rendered");

  //const router = useRouter();
  const [activeTicket, setActiveTicket] = useState<UserTicket | null>(null)
  const [activeStep, setActiveStep] = useState<number>(1)
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPembayaranModal, setShowPembayaranModal] = useState(false);
  const [userTicketIdForModal, setUserTicketIdForModal] = useState<string | null>(null);

  const handleOpenPembayaranModal = (userTicketId: string) => {
    setUserTicketIdForModal(userTicketId);
    setShowPembayaranModal(true);
  }


  // Reintroduce findActiveTicket logic
  const findActiveTicket = (tickets: UserTicket[]): UserTicket | null => {
    if (!tickets || tickets.length === 0) return null;

    // Prioritize paid and unused tickets
    const paidUnusedTicket = tickets.find(t => t.invoice?.status === 'settlement' && t.training_schedule_id === null);
    if (paidUnusedTicket) return paidUnusedTicket;

    // Then, paid and used tickets (in progress or completed stages)
    const inProgressTicket = tickets.find(t => t.invoice?.status === 'settlement' && t.training_schedule_id !== null);
    if (inProgressTicket) return inProgressTicket;

    // Fallback: return the most recently created ticket (even if unpaid)
    return tickets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  };

  const calculateCurrentStep = (ticket: UserTicket | null): number => {
    // Stage 1: No ticket or ticket not paid
    if (!ticket || ticket.invoice?.status !== 'settlement') return 1;
    
    // Stage 2: Paid ticket, but not yet registered for a training
    if (ticket.training_schedule_id === null) return 2;

    // Stage 3: Registered, but not yet submitted journal
    // This stage also handles the admin approval check internally
    if (ticket.user_ticket_detail?.article_path === null) return 3;

    // Stage 4: Submitted journal, but not yet attended training
    const hasAttended = Array.isArray(ticket?.presence) ? 
    ticket.presence.length > 0 && ticket.presence.some(p => p.attended_at !== null) : 
    ticket?.presence?.attended_at !== null;
    console.log(`[DEBUG] Ticket ID ${ticket.id} - hasAttended: ${hasAttended}`);
    if (!hasAttended) return 4;

    // Stage 5 & 6: Review and LOA
    const isApproved = ticket?.user_ticket_detail?.article_revision_status === 'approved';
    const hasLoa = ticket?.user_ticket_detail?.loa_path !== null;

    if (isApproved && hasLoa) {
      return 7; // All steps are complete, so we return a value > 6
    }

    return 5; // Otherwise, they are in some phase of the review process (pending, needs revision, or approved but waiting for LOA generation)
  };

  const getStepStatus = (step: number, currentActiveStep: number): string => {
    if (step < currentActiveStep) return "done";
    if (step === currentActiveStep) return "active";
    return "pending";
  };

  const fetchUserTickets = useCallback(async () => { // Renamed back to fetchUserTickets
    console.log("[DEBUG] fetchUserTickets started");
    setLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      console.log(`[ENDPOINT DEBUG] Fetching user ticket list: ${baseUrl}/user-tickets`);
      const resList = await api.get('/user-tickets'); // Get list of user tickets
      const ticketSummaries: UserTicket[] = Array.isArray(resList.data.data) ? resList.data.data : [];
      
      const detailedTicketsPromises = ticketSummaries.map(async (summary) => {
        try {
          console.log(`[ENDPOINT DEBUG] Fetching user ticket detail: ${baseUrl}/user-tickets/${summary.id}`);
          const detailRes = await api.get(`/user-tickets/${summary.id}`);
          // Merge the summary from the list with the full details from the detail endpoint
          return { ...summary, ...detailRes.data.data };
        } catch (error) {
          console.error(`Failed to fetch details for ticket ${summary.id}:`, error);
          return null; // Return null if a specific detail fetch fails
        }
      });

      const detailedTickets = (await Promise.all(detailedTicketsPromises)).filter((t): t is UserTicket => t !== null);
      console.log("[DEBUG] All detailed tickets fetched:", detailedTickets);
      
      const active = findActiveTicket(detailedTickets); // Find the active one
      setActiveTicket(active);
      
      // --- DEBUGGING LOG ---
      console.log("[pelatihanku/page.tsx] Active Ticket Object:", JSON.stringify(active, null, 2));
      // --- END DEBUGGING LOG ---

      const step = calculateCurrentStep(active);
      console.log(`[DEBUG] Calculated current step: ${step}`);
      setCurrentStep(step);
      // If all steps are complete (step > 6), show the final LOA view (step 6)
      setActiveStep(step > 6 ? 6 : step);

    } catch (err: unknown) {
      console.error('Gagal fetch user tickets:', err);
      setActiveTicket(null);
      setCurrentStep(1);
      setActiveStep(1);
    //   if (isAxiosError(err) && err.response?.status === 401) {
    //     alert('Sesi Anda telah berakhir, silakan login kembali.');
    //     router.push('/login-peserta');
    //   } else if (isAxiosError(err) && err.response) {
    //     interface ErrorData {
    //       message?: string;
    //     }
    //     const data: ErrorData = err.response.data as ErrorData;
    //     setError(data.message || 'Terjadi kesalahan saat memuat data pelatihan.');
    //   } else {
    //     setError('Terjadi kesalahan saat memuat data pelatihan.');
    //   }
    } finally {
      setLoading(false);
      console.log("[DEBUG] fetchUserTickets finished");
    }
  }, []);//router]);

//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       alert('Anda harus login untuk mengakses halaman ini.');
//       router.push('/login-peserta');
//       return;
//     }
//     fetchUserTickets();
//   }, [fetchUserTickets, router]);

  useEffect(() => {
    if (activeStep) {
      console.log(`%c[STAGE DEBUG] Switched to Stage ${activeStep}`, 'color: #4CAF50; font-weight: bold; font-size: 14px;');
    }
  }, [activeStep]);

  const handleRefresh = () => {
    fetchUserTickets();
  }

  const handleNavigation = (step: number) => {
    if (currentStep && step <= currentStep) {
      console.log(`[DEBUG] Navigating to step: ${step}`);
      setActiveStep(step);
    }
  }

//   if (loading) {
//     return <PageLoader />;
//   }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-red-500">
        Error: {error}
      </div>
    )
  }

  const stepStatus = {
    1: getStepStatus(1, currentStep || 1),
    2: getStepStatus(2, currentStep || 1),
    3: getStepStatus(3, currentStep || 1),
    4: getStepStatus(4, currentStep || 1),
    5: getStepStatus(5, currentStep || 1),
    6: getStepStatus(6, currentStep || 1),
  };

  console.log(`[DEBUG] Rendering component for activeStep: ${activeStep}`);

  return (
    <>
      <NavbarPeserta />
      <main className="min-h-screen pt-35 md:px-20 px-4 py-10 bg-[#909C90] text-[#F5F3EC]">
        <div className="w-full overflow-x-auto">
          <div className="flex items-center justify-between w-full min-w-[600px] sm:min-w-full">
            <StageTracker
              stepStatus={stepStatus}
              currentStep={activeStep} // The visually active step
              onClickStep={(step) => {
                if (stepStatus[step as keyof typeof stepStatus] !== 'pending') {
                  setActiveStep(step)
                }
              }}
            />
          </div>
        </div>

        {activeStep === 1 && (
          <TiketSection
            activeTicket={activeTicket}
            onNavigate={handleNavigation}
            onOpenPembayaranModal={handleOpenPembayaranModal}
          />
        )}

        {activeStep === 2 && (
          <DaftarPelatihanSection
            activeTicket={activeTicket}
            onRegistrationSuccess={handleRefresh}
          />
        )}

        {activeStep === 3 && (
          <SubmitJurnalSection
            activeTicket={activeTicket}
            onSubmitJurnal={handleRefresh}
          />
        )}

        {activeStep === 4 && (
          <IkutPelatihanSection
            activeTicket={activeTicket}
            onHadir={handleRefresh}
          />
        )}

        {activeStep === 5 && (
          <ReviewJurnalSection
            activeTicket={activeTicket}
            onUploadRevisi={handleRefresh}
            onNavigate={handleNavigation}
          />
        )}

        {activeStep === 6 && <LOASection activeTicket={activeTicket} />}
      </main>
      <PembayaranModal 
        isOpen={showPembayaranModal} 
        onClose={() => setShowPembayaranModal(false)} 
        userTicketId={userTicketIdForModal} 
      />
    </>
  )
}
