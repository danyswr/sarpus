import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-2">Tentang Mahasiswa Voice</h1>
            <p className="text-gray-600">Platform untuk menyuarakan keluh kesah dan saran mahasiswa</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Visi</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Menjadi platform utama yang menghubungkan mahasiswa dengan institusi pendidikan untuk menciptakan
                  lingkungan akademik yang lebih baik.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Misi</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  <li>Memberikan ruang aman untuk mahasiswa menyampaikan aspirasi</li>
                  <li>Memfasilitasi komunikasi dua arah antara mahasiswa dan institusi</li>
                  <li>Mendorong partisipasi aktif mahasiswa dalam pengembangan kampus</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Fitur Platform</CardTitle>
              <CardDescription>Berbagai fitur yang tersedia untuk mendukung komunikasi yang efektif</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4">
                  <div className="bg-yellow-400 p-3 rounded-lg inline-block mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2">Posting Keluhan</h3>
                  <p className="text-sm text-gray-600">Sampaikan keluhan dan saran dengan mudah</p>
                </div>

                <div className="text-center p-4">
                  <div className="bg-cyan-400 p-3 rounded-lg inline-block mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 9V5a3 3 0 0 0-6 0v4"></path>
                      <rect x="2" y="9" width="20" height="12" rx="2" ry="2"></rect>
                      <circle cx="12" cy="15" r="1"></circle>
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2">Keamanan Data</h3>
                  <p className="text-sm text-gray-600">Data pengguna terlindungi dengan enkripsi</p>
                </div>

                <div className="text-center p-4">
                  <div className="bg-pink-400 p-3 rounded-lg inline-block mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2">Komunitas</h3>
                  <p className="text-sm text-gray-600">Berinteraksi dengan sesama mahasiswa</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
