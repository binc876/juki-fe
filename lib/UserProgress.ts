export type RegistrationData = {
  nama: string
  nim: string
  email: string
  whatsapp: string
  judulArtikel: string
  jadwal: string
  isVerified: boolean
  buktiBayarUrl: string
  suratPernyataanUrl: string
}

export type UserProgress = {
  hasTicket: boolean
  isTicketUsed: boolean
  hasRegistered: boolean
  registrationData: RegistrationData | null
  pendaftaranDisetujui: boolean
  jurnalSubmitted: boolean
  hadirPelatihan: boolean
  tidakHadirPelatihan: boolean
  jadwalReschedule: string | null
  jurnalButuhRevisi: boolean
  buktiRevisiUploaded: boolean
  revisiDisetujui: boolean
  loaTerbit: boolean
}

export type Peserta = {
  id: number
  nama_lengkap: string
  nim: string
  email: string
  hasTicket?: {
    is_used: boolean
  }
  pelatihan_peserta?: {
    no_whatsapp: string
    judul_artikel: string
    jadwal_pelatihan: string
  }
  status_progress: string
}