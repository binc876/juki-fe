const dummyJadwalPelatihan = [
  {
    id: 1,
    batch_number: "Batch 1",
    subtitle: "Pelatihan Jurnal Nasional",
    started_at: "2025-01-10T08:00:00",
    ended_at: "2025-01-10T12:00:00",
    location: "Ruang Seminar A",
    lecturer: "Dr. Andi Wijaya",
    quota: 30,
    current_quota: 12,
  },
  {
    id: 2,
    batch_number: "Batch 2",
    subtitle: "Pelatihan Jurnal Internasional",
    started_at: "2025-01-15T09:00:00",
    ended_at: "2025-01-15T13:00:00",
    location: "Ruang Seminar B",
    lecturer: "Prof. Siti Rahma",
    quota: 25,
    current_quota: 25, // penuh (akan ke-filter)
  },
  {
    id: 3,
    batch_number: "Batch 3",
    subtitle: "Workshop Penulisan Artikel",
    started_at: "2025-01-20T08:30:00",
    ended_at: "2025-01-20T11:30:00",
    location: "Aula Utama",
    lecturer: "Dr. Budi Santoso",
    quota: 40,
    current_quota: 18,
  },
  {
    id: 4,
    batch_number: "Batch 4",
    subtitle: "Klinik Publikasi Ilmiah",
    started_at: "2025-01-25T10:00:00",
    ended_at: "2025-01-25T14:00:00",
    location: "Online (Zoom)",
    lecturer: "Prof. Ahmad Fauzi",
    quota: 50,
    current_quota: 40,
  },
]

export default dummyJadwalPelatihan
