import Link from "next/link"
import { Sparkles, ArrowRight, Play, Trophy, Users, Medal } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b-2 border-black">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-[#FFD600] p-2 rounded-lg border-2 border-black">
              <Trophy className="text-black" />
            </div>
            <div>
              <h1 className="text-xl font-black">MAHASISWA VOICE</h1>
              <p className="text-xs font-medium text-gray-600">NEXT-GEN PLATFORM</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="font-bold uppercase">
              Beranda
            </Link>
            <Link href="/posts" className="font-bold uppercase">
              Postingan
            </Link>
            <Link href="/about" className="font-bold uppercase">
              Tentang
            </Link>
            <Link href="/contact" className="font-bold uppercase">
              Kontak
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <button className="btn-outline">Masuk</button>
            </Link>
            <Link href="/register">
              <button className="btn-primary">Daftar</button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 text-center">
          <div className="container mx-auto px-4">
            <div className="platform-badge mb-6">
              <Sparkles className="h-4 w-4 mr-2" />
              <span className="text-sm font-bold">PLATFORM MAHASISWA VOICE</span>
            </div>

            <h1 className="section-title">Daftar</h1>
            <h2 className="section-subtitle">Pertandingan</h2>
            <div className="pink-underline"></div>

            <h2 className="text-4xl font-black mb-6">LIMITS</h2>

            <p className="text-xl mb-10 max-w-3xl mx-auto">
              Bergabunglah dengan <span className="highlight-box highlight-cyan">revolusi digital</span> dalam dunia
              pendidikan dan raih <span className="highlight-box highlight-pink">prestasi terbaik</span>
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register">
                <button className="btn-primary btn-icon">
                  <ArrowRight className="h-5 w-5" />
                  MULAI SEKARANG
                </button>
              </Link>
              <Link href="/posts">
                <button className="btn-outline btn-icon">
                  <Play className="h-5 w-5" />
                  LIHAT POSTINGAN
                </button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="card-yellow stat-card">
                <div className="stat-icon">
                  <Trophy />
                </div>
                <div className="stat-number">100+</div>
                <div className="stat-label">POSTINGAN AKTIF</div>
              </div>

              <div className="card-cyan stat-card">
                <div className="stat-icon">
                  <Users />
                </div>
                <div className="stat-number">500+</div>
                <div className="stat-label">MAHASISWA TERDAFTAR</div>
              </div>

              <div className="card-pink stat-card">
                <div className="stat-icon">
                  <Medal />
                </div>
                <div className="stat-number">10+</div>
                <div className="stat-label">KATEGORI TERSEDIA</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-black text-white py-10 border-t-2 border-black">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Mahasiswa Voice</h3>
              <p className="text-gray-400">Platform untuk kebutuhan keluh kesah dan saran mahasiswa.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-400 hover:text-white">
                    Beranda
                  </Link>
                </li>
                <li>
                  <Link href="/posts" className="text-gray-400 hover:text-white">
                    Postingan
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-gray-400 hover:text-white">
                    Tentang
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Kontak</h3>
              <p className="text-gray-400">Email: info@mahasiswavoice.com</p>
              <p className="text-gray-400">Phone: +62 123 456 789</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Mahasiswa Voice. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
