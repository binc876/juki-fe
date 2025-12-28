export interface User {
  id: number;
  name: string;
  email: string;
  student_number: string | null;
  mobile_number: string | null;
}

export interface TrainingSchedule {
  id: number;
  title: string;
  subtitle: string;
  started_at: string;
  ended_at: string;
  location: string;
  lecturer: string;
  quota: number;
  current_quota: number;
  batch_number: string;
}

export interface UserTicket {
  id: number;
  ticket_id: number;
  user_id: number;
  user?: User;
  training_schedule_id: number | null;
  invoice_id: number;
  paid_at: string | null;
  approved_by_admin_at: string | null;
  created_at: string;
  updated_at: string;
  ticket: {
    id: number;
    title: string;
    description: string;
    price: number;
  };
  invoice: {
    status: string;
    order_id: string;
    gross_amount: number;
    invoiceable: {
      bank_code: string;
      va_number: string;
    };
  };
  training_schedule: TrainingSchedule | null;
  user_ticket_detail: {
    id: number;
    article_title: string | null;
    payment_evidence_path: string | null;
    statement_letter_path: string | null;
    article_path: string | null;
    payment_evidence_url: string | null;
    statement_letter_url: string | null;
    article_url: string | null;
    article_revision_status?: 'approved' | 'revise' | 'pending';
    loa_path?: string | null;
    loa_url?: string | null;
    free_of_plagiarism_path?: string | null;
    free_of_plagiarism_naspub_path?: string | null;
    thesis_cover_letter_path?: string | null;
    thesis_introduction_path?: string | null;
    thesis_chapter_1_path?: string | null;
    thesis_chapter_2_path?: string | null;
    thesis_chapter_3_path?: string | null;
    thesis_chapter_4_path?: string | null;
    thesis_chapter_5_path?: string | null;
    thesis_chapter_other_path?: string | null;
    thesis_approval_sheet_path?: string | null;
    thesis_liability_letter_path?: string | null;
    alumni_donation_path?: string | null;
    article_revision_evidence_url?: string | null;
  } | null;
  presence?: {
    id: number;
    attended_at: string | null;
  } | Array<{
    id: number;
    attended_at: string | null;
  }>;
}

export interface LiabilityFree {
  id: number;
  user_id: number;
  submission_location: string;
  submitted_journal_link: string;
  free_of_plagiarism_path: string | null;
  free_of_plagiarism_naspub_path: string | null;
  thesis_cover_letter_path: string | null;
  thesis_introduction_path: string | null;
  thesis_chapter_1_path: string | null;
  thesis_chapter_2_path: string | null;
  thesis_chapter_3_path: string | null;
  thesis_chapter_4_path: string | null;
  thesis_chapter_5_path: string | null;
  thesis_chapter_other_path: string | null;
  thesis_approval_sheet_path: string | null;
  thesis_liability_letter_path: string | null;
  alumni_donation_path: string | null;
  judiciary_evidence_path: string | null;
  free_of_plagiarism_url: string | null;
  free_of_plagiarism_naspub_url: string | null;
  thesis_cover_letter_url: string | null;
  thesis_introduction_url: string | null;
  thesis_chapter_1_url: string | null;
  thesis_chapter_2_url: string | null;
  thesis_chapter_3_url: string | null;
  thesis_chapter_4_url: string | null;
  thesis_chapter_5_url: string | null;
  thesis_chapter_other_url: string | null;
  thesis_approval_sheet_url: string | null;
  thesis_liability_letter_url: string | null;
  alumni_donation_url: string | null;
  judiciary_evidence_url: string | null;
  is_accepted_by_admin: number;
  status?: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Participant {
  id: number;
  name: string;
  student_number: string;
  email: string;
  mobile_number: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  user_tickets?: Array<{
    id: number;
    ticket_id: number;
    user_id: number;
    training_schedule_id: number | null;
    invoice_id: number;
    paid_at: string | null; // ← Tambahkan paid_at di sini
    approved_by_admin_at: string | null;
    created_at: string;
    updated_at: string;
    user_ticket_detail: {
      article_title: string | null;
      loa_path: string | null;
      loa_url: string | null;
      payment_evidence_url: string | null;
      statement_letter_url: string | null;
      article_url: string | null;
      article_revision_evidence_url: string | null;
    } | null;
  }>;
}

export interface Feedback {
  id: number;
  content: string;
  created_at: string;
}