// File: lib/dummyData.ts

export const dummyPesertaData = [
  // 1. Belum punya tiket
  {
    id: 1,
    name: "Ahmad Fauzi",
    student_number: "160810101001",
    email: "ahmad.fauzi@students.unair.ac.id",
    mobile_number: "081234567801",
    created_at: "2024-01-15T08:30:00Z",
    updated_at: "2024-01-15T08:30:00Z",
    roles: []
  },
  
  // 2. Sudah bayar pelatihan (punya tiket tapi belum daftar)
  {
    id: 2,
    name: "Siti Nurhaliza",
    student_number: "160810101002",
    email: "siti.nurhaliza@students.unair.ac.id",
    mobile_number: "081234567802",
    created_at: "2024-01-16T09:00:00Z",
    updated_at: "2024-01-20T10:00:00Z",
    user_tickets: [
      {
        id: 1,
        user_id: 2,
        training_schedule_id: null,
        paid_at: "2024-01-20T10:00:00Z",
        created_at: "2024-01-16T09:00:00Z",
        updated_at: "2024-01-20T10:00:00Z",
        invoice: {
          id: 1,
          user_ticket_id: 1,
          status: "settlement",
          amount: 150000,
          created_at: "2024-01-16T09:00:00Z",
          updated_at: "2024-01-20T10:00:00Z"
        },
        user_ticket_detail: {
          id: 1,
          user_ticket_id: 1,
          article_title: null,
          article_path: null,
          article_url: null,
          article_revision_status: null,
          loa_path: null,
          loa_url: null,
          payment_evidence_url: "https://example.com/payment1.jpg",
          statement_letter_url: null,
          article_revision_evidence_url: null,
          created_at: "2024-01-16T09:00:00Z",
          updated_at: "2024-01-20T10:00:00Z"
        },
        presence: []
      }
    ],
    roles: []
  },
  
  // 3. Sudah daftar pelatihan
  {
    id: 3,
    name: "Budi Santoso",
    student_number: "160810101003",
    email: "budi.santoso@students.unair.ac.id",
    mobile_number: "081234567803",
    created_at: "2024-01-17T10:30:00Z",
    updated_at: "2024-01-25T14:00:00Z",
    user_tickets: [
      {
        id: 2,
        user_id: 3,
        training_schedule_id: 1,
        paid_at: "2024-01-21T11:00:00Z",
        created_at: "2024-01-17T10:30:00Z",
        updated_at: "2024-01-25T14:00:00Z",
        invoice: {
          id: 2,
          user_ticket_id: 2,
          status: "settlement",
          amount: 150000,
          created_at: "2024-01-17T10:30:00Z",
          updated_at: "2024-01-21T11:00:00Z"
        },
        user_ticket_detail: {
          id: 2,
          user_ticket_id: 2,
          article_title: null,
          article_path: null,
          article_url: null,
          article_revision_status: null,
          loa_path: null,
          loa_url: null,
          payment_evidence_url: "https://example.com/payment2.jpg",
          statement_letter_url: "https://example.com/statement2.pdf",
          article_revision_evidence_url: null,
          created_at: "2024-01-17T10:30:00Z",
          updated_at: "2024-01-25T14:00:00Z"
        },
        presence: []
      }
    ],
    roles: []
  },
  
  // 4. Belum submit artikel di OJS
  {
    id: 4,
    name: "Dewi Lestari",
    student_number: "160810101004",
    email: "dewi.lestari@students.unair.ac.id",
    mobile_number: "081234567804",
    created_at: "2024-01-18T11:00:00Z",
    updated_at: "2024-01-28T09:00:00Z",
    user_tickets: [
      {
        id: 3,
        user_id: 4,
        training_schedule_id: 1,
        paid_at: "2024-01-22T12:00:00Z",
        created_at: "2024-01-18T11:00:00Z",
        updated_at: "2024-01-28T09:00:00Z",
        invoice: {
          id: 3,
          user_ticket_id: 3,
          status: "settlement",
          amount: 150000,
          created_at: "2024-01-18T11:00:00Z",
          updated_at: "2024-01-22T12:00:00Z"
        },
        user_ticket_detail: {
          id: 3,
          user_ticket_id: 3,
          article_title: "Analisis Pengaruh Inflasi terhadap Pertumbuhan Ekonomi",
          article_path: null,
          article_url: null,
          article_revision_status: "pending",
          loa_path: null,
          loa_url: null,
          payment_evidence_url: "https://example.com/payment3.jpg",
          statement_letter_url: "https://example.com/statement3.pdf",
          article_revision_evidence_url: null,
          created_at: "2024-01-18T11:00:00Z",
          updated_at: "2024-01-28T09:00:00Z"
        },
        presence: []
      }
    ],
    roles: []
  },
  
  // 5. Sudah submit artikel di OJS
  {
    id: 5,
    name: "Eko Prasetyo",
    student_number: "160810101005",
    email: "eko.prasetyo@students.unair.ac.id",
    mobile_number: "081234567805",
    created_at: "2024-01-19T12:00:00Z",
    updated_at: "2024-02-01T10:00:00Z",
    user_tickets: [
      {
        id: 4,
        user_id: 5,
        training_schedule_id: 1,
        paid_at: "2024-01-23T13:00:00Z",
        created_at: "2024-01-19T12:00:00Z",
        updated_at: "2024-02-01T10:00:00Z",
        invoice: {
          id: 4,
          user_ticket_id: 4,
          status: "settlement",
          amount: 150000,
          created_at: "2024-01-19T12:00:00Z",
          updated_at: "2024-01-23T13:00:00Z"
        },
        user_ticket_detail: {
          id: 4,
          user_ticket_id: 4,
          article_title: "Dampak Kebijakan Fiskal dalam Perekonomian Indonesia",
          article_path: "articles/article-004.pdf",
          article_url: "https://example.com/articles/article-004.pdf",
          article_revision_status: "pending",
          loa_path: null,
          loa_url: null,
          payment_evidence_url: "https://example.com/payment4.jpg",
          statement_letter_url: "https://example.com/statement4.pdf",
          article_revision_evidence_url: null,
          created_at: "2024-01-19T12:00:00Z",
          updated_at: "2024-02-01T10:00:00Z"
        },
        presence: []
      }
    ],
    roles: []
  },
  
  // 6. Sudah mengikuti pelatihan
  {
    id: 6,
    name: "Fitri Handayani",
    student_number: "160810101006",
    email: "fitri.handayani@students.unair.ac.id",
    mobile_number: "081234567806",
    created_at: "2024-01-20T13:00:00Z",
    updated_at: "2024-02-05T14:00:00Z",
    user_tickets: [
      {
        id: 5,
        user_id: 6,
        training_schedule_id: 1,
        paid_at: "2024-01-24T14:00:00Z",
        created_at: "2024-01-20T13:00:00Z",
        updated_at: "2024-02-05T14:00:00Z",
        invoice: {
          id: 5,
          user_ticket_id: 5,
          status: "settlement",
          amount: 150000,
          created_at: "2024-01-20T13:00:00Z",
          updated_at: "2024-01-24T14:00:00Z"
        },
        user_ticket_detail: {
          id: 5,
          user_ticket_id: 5,
          article_title: "Studi Kasus Perdagangan Internasional di Era Digital",
          article_path: "articles/article-005.pdf",
          article_url: "https://example.com/articles/article-005.pdf",
          article_revision_status: "pending",
          loa_path: null,
          loa_url: null,
          payment_evidence_url: "https://example.com/payment5.jpg",
          statement_letter_url: "https://example.com/statement5.pdf",
          article_revision_evidence_url: null,
          created_at: "2024-01-20T13:00:00Z",
          updated_at: "2024-02-05T14:00:00Z"
        },
        presence: [
          {
            id: 1,
            user_ticket_id: 5,
            attended_at: "2024-02-05T08:00:00Z",
            created_at: "2024-02-05T08:00:00Z",
            updated_at: "2024-02-05T08:00:00Z"
          }
        ]
      }
    ],
    roles: []
  },
  
  // 7. Sudah review artikel (needs revision)
  {
    id: 7,
    name: "Gilang Ramadhan",
    student_number: "160810101007",
    email: "gilang.ramadhan@students.unair.ac.id",
    mobile_number: "081234567807",
    created_at: "2024-01-21T14:00:00Z",
    updated_at: "2024-02-10T11:00:00Z",
    user_tickets: [
      {
        id: 6,
        user_id: 7,
        training_schedule_id: 1,
        paid_at: "2024-01-25T15:00:00Z",
        created_at: "2024-01-21T14:00:00Z",
        updated_at: "2024-02-10T11:00:00Z",
        invoice: {
          id: 6,
          user_ticket_id: 6,
          status: "settlement",
          amount: 150000,
          created_at: "2024-01-21T14:00:00Z",
          updated_at: "2024-01-25T15:00:00Z"
        },
        user_ticket_detail: {
          id: 6,
          user_ticket_id: 6,
          article_title: "Pengaruh Investasi Asing terhadap Sektor Manufaktur",
          article_path: "articles/article-006.pdf",
          article_url: "https://example.com/articles/article-006.pdf",
          article_revision_status: "needs_revision",
          loa_path: null,
          loa_url: null,
          payment_evidence_url: "https://example.com/payment6.jpg",
          statement_letter_url: "https://example.com/statement6.pdf",
          article_revision_evidence_url: null,
          created_at: "2024-01-21T14:00:00Z",
          updated_at: "2024-02-10T11:00:00Z"
        },
        presence: [
          {
            id: 2,
            user_ticket_id: 6,
            attended_at: "2024-02-05T08:00:00Z",
            created_at: "2024-02-05T08:00:00Z",
            updated_at: "2024-02-05T08:00:00Z"
          }
        ]
      }
    ],
    roles: []
  },
  
  // 8. Sudah terbit LOA
  {
    id: 8,
    name: "Hendra Wijaya",
    student_number: "160810101008",
    email: "hendra.wijaya@students.unair.ac.id",
    mobile_number: "081234567808",
    created_at: "2024-01-22T15:00:00Z",
    updated_at: "2024-02-15T16:00:00Z",
    user_tickets: [
      {
        id: 7,
        user_id: 8,
        training_schedule_id: 1,
        paid_at: "2024-01-26T16:00:00Z",
        created_at: "2024-01-22T15:00:00Z",
        updated_at: "2024-02-15T16:00:00Z",
        invoice: {
          id: 7,
          user_ticket_id: 7,
          status: "settlement",
          amount: 150000,
          created_at: "2024-01-22T15:00:00Z",
          updated_at: "2024-01-26T16:00:00Z"
        },
        user_ticket_detail: {
          id: 7,
          user_ticket_id: 7,
          article_title: "Analisis Kebijakan Moneter Bank Indonesia",
          article_path: "articles/article-007.pdf",
          article_url: "https://example.com/articles/article-007.pdf",
          article_revision_status: "approved",
          loa_path: "loa/loa-007.pdf",
          loa_url: "https://example.com/loa/loa-007.pdf",
          payment_evidence_url: "https://example.com/payment7.jpg",
          statement_letter_url: "https://example.com/statement7.pdf",
          article_revision_evidence_url: "https://example.com/revision7.jpg",
          created_at: "2024-01-22T15:00:00Z",
          updated_at: "2024-02-15T16:00:00Z"
        },
        presence: [
          {
            id: 3,
            user_ticket_id: 7,
            attended_at: "2024-02-05T08:00:00Z",
            created_at: "2024-02-05T08:00:00Z",
            updated_at: "2024-02-05T08:00:00Z"
          }
        ]
      }
    ],
    roles: []
  },
  
  // 9. Belum bayar (ada tiket tapi belum bayar)
  {
    id: 9,
    name: "Indah Permata",
    student_number: "160810101009",
    email: "indah.permata@students.unair.ac.id",
    mobile_number: "081234567809",
    created_at: "2024-01-23T16:00:00Z",
    updated_at: "2024-01-23T16:00:00Z",
    user_tickets: [
      {
        id: 8,
        user_id: 9,
        training_schedule_id: null,
        paid_at: null,
        created_at: "2024-01-23T16:00:00Z",
        updated_at: "2024-01-23T16:00:00Z",
        invoice: {
          id: 8,
          user_ticket_id: 8,
          status: "pending",
          amount: 150000,
          created_at: "2024-01-23T16:00:00Z",
          updated_at: "2024-01-23T16:00:00Z"
        },
        user_ticket_detail: null,
        presence: []
      }
    ],
    roles: []
  },
  
  // 10. Artikel pending review
  {
    id: 10,
    name: "Joko Susanto",
    student_number: "160810101010",
    email: "joko.susanto@students.unair.ac.id",
    mobile_number: "081234567810",
    created_at: "2024-01-24T17:00:00Z",
    updated_at: "2024-02-08T12:00:00Z",
    user_tickets: [
      {
        id: 9,
        user_id: 10,
        training_schedule_id: 1,
        paid_at: "2024-01-27T17:00:00Z",
        created_at: "2024-01-24T17:00:00Z",
        updated_at: "2024-02-08T12:00:00Z",
        invoice: {
          id: 9,
          user_ticket_id: 9,
          status: "settlement",
          amount: 150000,
          created_at: "2024-01-24T17:00:00Z",
          updated_at: "2024-01-27T17:00:00Z"
        },
        user_ticket_detail: {
          id: 9,
          user_ticket_id: 9,
          article_title: "Evaluasi Program Bantuan Sosial dalam Perekonomian",
          article_path: "articles/article-009.pdf",
          article_url: "https://example.com/articles/article-009.pdf",
          article_revision_status: "pending",
          loa_path: null,
          loa_url: null,
          payment_evidence_url: "https://example.com/payment9.jpg",
          statement_letter_url: "https://example.com/statement9.pdf",
          article_revision_evidence_url: null,
          created_at: "2024-01-24T17:00:00Z",
          updated_at: "2024-02-08T12:00:00Z"
        },
        presence: [
          {
            id: 4,
            user_ticket_id: 9,
            attended_at: "2024-02-05T08:00:00Z",
            created_at: "2024-02-05T08:00:00Z",
            updated_at: "2024-02-05T08:00:00Z"
          }
        ]
      }
    ],
    roles: []
  }
]