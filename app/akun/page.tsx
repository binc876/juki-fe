'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { User, FileText, MessageSquare, Loader2, Download, Eye } from 'lucide-react'
import NavbarPeserta from '@/components/dashboard/NavbarPeserta'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AkunPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [profile, setProfile] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [newFeedback, setNewFeedback] = useState('')

  const handleCreateFeedback = async () => {
    try {
      await api.post('/feedbacks', { message: newFeedback })
      setNewFeedback('')
      setShowFeedbackForm(false)
      // Refresh list
      const res = await api.get('/feedbacks/me')
      setFeedbacks(Array.isArray(res.data) ? res.data : (res.data.data || []))
    } catch (err) {
      console.error('Gagal mengirim feedback:', err)
      alert('Gagal mengirim feedback')
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        if (activeTab === 'profile') {
          const res = await api.get('/profiles/me')
          setProfile(res.data.data || res.data)
        } else if (activeTab === 'documents') {
          const res = await api.get('/attachments/me')
          setDocuments(Array.isArray(res.data) ? res.data : (res.data.data || []))
        } else if (activeTab === 'feedback') {
          // Menggunakan /feedbacks/me untuk list feedback user
          const res = await api.get('/feedbacks/me')
          setFeedbacks(Array.isArray(res.data) ? res.data : (res.data.data || []))
        }
      } catch (err) {
        console.error('Gagal mengambil data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [activeTab])

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#5C7B78]" />
        </div>
      )
    }

    switch (activeTab) {
      case 'profile':
        return (
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-[#5C7B78]">Informasi Pribadi</CardTitle>
              <CardDescription>Data diri kamu yang terdaftar di sistem.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm text-gray-500">Nama Lengkap</label>
                    <p className="font-medium text-gray-900">{profile.fullName || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-gray-500">Email</label>
                    <p className="font-medium text-gray-900">{profile.email || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-gray-500">NIM</label>
                    <p className="font-medium text-gray-900">{profile.nim || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-gray-500">Nomor Telepon</label>
                    <p className="font-medium text-gray-900">{profile.phone || '-'}</p>
                  </div>
                   <div className="space-y-1">
                    <label className="text-sm text-gray-500">Role</label>
                    <p className="font-medium text-gray-900">{profile.role || '-'}</p>
                  </div>
                   <div className="space-y-1">
                    <label className="text-sm text-gray-500">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      profile.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {profile.status || '-'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Gagal memuat profil.</p>
              )}
            </CardContent>
          </Card>
        )

      case 'documents':
        return (
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-[#5C7B78]">Dokumen Saya</CardTitle>
              <CardDescription>Daftar dokumen yang telah kamu upload.</CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <div className="space-y-4">
                  {documents.map((doc: any, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border rounded-xl bg-white hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-[#5C7B78]/10 rounded-lg">
                          <FileText className="w-6 h-6 text-[#5C7B78]" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{doc.filename || `Dokumen #${idx + 1}`}</p>
                          <p className="text-xs text-gray-500">{doc.type || 'File'} • {new Date(doc.createdAt).toLocaleDateString('id-ID')}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* Contoh button action */}
                        <Button variant="outline" size="icon" className="h-8 w-8 text-gray-500" title="Preview">
                            <Eye className="w-4 h-4"/>
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 text-gray-500" title="Download">
                            <Download className="w-4 h-4"/>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                 <div className="text-center py-10">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                        <FileText className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500">Belum ada dokumen yang diupload.</p>
                 </div>
              )}
            </CardContent>
          </Card>
        )

      case 'feedback':
        return (
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl text-[#5C7B78]">Feedback</CardTitle>
                <CardDescription>Riwayat masukan yang telah kamu kirim.</CardDescription>
              </div>
              <Button onClick={() => setShowFeedbackForm(true)} className="bg-[#5C7B78] hover:bg-[#4e6a67] text-white">Buat Feedback</Button>
            </CardHeader>
            <CardContent>
              {showFeedbackForm && (
                <div className="mb-6 p-4 border rounded-xl bg-gray-50 space-y-3">
                  <h3 className="font-semibold text-gray-700">Kirim Masukan Baru</h3>
                  <textarea
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#5C7B78] outline-none text-sm"
                    rows={3}
                    placeholder="Tulis masukan kamu di sini..."
                    value={newFeedback}
                    onChange={(e) => setNewFeedback(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowFeedbackForm(false)}>Batal</Button>
                    <Button 
                      onClick={handleCreateFeedback} 
                      className="bg-[#5C7B78] hover:bg-[#4e6a67] text-white"
                      disabled={!newFeedback.trim()}
                    >
                      Kirim
                    </Button>
                  </div>
                </div>
              )}

              {feedbacks.length > 0 ? (
                <div className="grid gap-4">
                  {feedbacks.map((item: any, idx) => (
                    <div key={idx} className="p-4 border rounded-xl bg-white space-y-2">
                      <div className="flex justify-between items-start">
                         <p className="text-sm font-medium text-gray-900">{item.message}</p>
                         <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                        <MessageSquare className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500">Belum ada feedback yang dikirim.</p>
                 </div>
              )}
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <NavbarPeserta />
      
      <main className="max-w-6xl mx-auto pt-24 pb-12 px-4 md:px-6">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 shrink-0 space-y-4">
             <div className="p-6 bg-white rounded-2xl border shadow-sm flex flex-col items-center text-center">
                <div className="w-20 h-20 relative mb-4">
                     <Image 
                        src="/account-pic.jpg"
                        alt="Profile"
                        fill
                        className="object-cover rounded-full border-2 border-white shadow-md"
                     />
                </div>
                <h2 className="font-bold text-gray-900 line-clamp-1">{profile?.fullName || 'User'}</h2>
                <p className="text-xs text-gray-500">{profile?.email || 'user@example.com'}</p>
             </div>

             <nav className="bg-white rounded-2xl border shadow-sm p-2 space-y-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
                    activeTab === 'profile' 
                      ? 'bg-[#5C7B78] text-white shadow-md' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span>Informasi Pribadi</span>
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
                    activeTab === 'documents' 
                      ? 'bg-[#5C7B78] text-white shadow-md' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span>Dokumen</span>
                </button>
                <button
                  onClick={() => setActiveTab('feedback')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
                    activeTab === 'feedback' 
                      ? 'bg-[#5C7B78] text-white shadow-md' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Feedback</span>
                </button>
             </nav>
          </aside>

          {/* Main Content */}
          <section className="flex-1">
             {renderContent()}
          </section>

        </div>
      </main>
    </div>
  )
}