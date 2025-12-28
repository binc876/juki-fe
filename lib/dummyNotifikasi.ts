export type Notifikasi = {
  tanggal: string; // format: YYYY-MM-DD
  isi: string;
};

export const dummyNotifikasi: Notifikasi[] = [
  {
    tanggal: '2025-08-25',
    isi: 'LOA kamu sudah terbit!',
  },
  {
    tanggal: '2025-08-18',
    isi: 'Oh no! Kamu tidak mengikuti pelatihan',
  },
  {
    tanggal: '2025-08-02',
    isi: 'Form daftar pelatihan kamu sudah di verifikasi Admin.',
  },
  {
    tanggal: '2025-08-01',
    isi: 'Pembelian tiket kamu berhasil!',
  },
];
