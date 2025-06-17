"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { registerUser } from "@/lib/api"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    nim: "",
    gender: "Male",
    jurusan: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRadioChange = (value: string) => {
    setFormData((prev) => ({ ...prev, gender: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setError("Password tidak cocok")
      return
    }

    if (formData.password.length < 6) {
      setError("Password minimal 6 karakter")
      return
    }

    if (!formData.jurusan) {
      setError("Jurusan harus dipilih")
      return
    }

    setIsLoading(true)

    try {
      // Hash password before sending
      const hashedPassword = btoa(formData.password) // Simple base64 encoding for demo
      
      const response = await registerUser({
        email: formData.email,
        username: formData.username,
        password: hashedPassword,
        nim: formData.nim,
        gender: formData.gender,
        jurusan: formData.jurusan,
      })

      if (response.error) {
        throw new Error(response.error)
      }

      setSuccess("Registrasi berhasil! Redirecting to login...")

      // Reset form
      setFormData({
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
        nim: "",
        gender: "Male",
        jurusan: "",
      })

      setTimeout(() => {
        router.push("/login?registered=true")
      }, 2000)
    } catch (err: any) {
      console.error("Registration error:", err)
      setError(err.message || "Terjadi kesalahan saat mendaftar. Silakan coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/">
            <div className="inline-block">
              <div className="bg-yellow-400 p-3 rounded-lg border-2 border-black inline-flex mb-2">
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
                  className="text-black"
                >
                  <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>
                </svg>
              </div>
            </div>
          </Link>
          <h2 className="text-3xl font-black">Daftar Akun</h2>
          <p className="text-gray-600">Buat akun baru untuk mengakses platform</p>
        </div>

        <div
          className="bg-white border-2 border-black rounded-xl p-6"
          style={{ boxShadow: "4px 4px 0px 0px rgba(0, 0, 0, 0.25)" }}
        >
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-bold mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="nama@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-bold mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div>
              <label htmlFor="nim" className="block text-sm font-bold mb-1">
                NIM
              </label>
              <input
                id="nim"
                name="nim"
                type="text"
                value={formData.nim}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">Jenis Kelamin</label>
              <div className="flex gap-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="male"
                    name="gender"
                    checked={formData.gender === "Male"}
                    onChange={() => handleRadioChange("Male")}
                    className="mr-2"
                  />
                  <label htmlFor="male" className="text-sm">
                    Laki-laki
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="female"
                    name="gender"
                    checked={formData.gender === "Female"}
                    onChange={() => handleRadioChange("Female")}
                    className="mr-2"
                  />
                  <label htmlFor="female" className="text-sm">
                    Perempuan
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="jurusan" className="block text-sm font-bold mb-1">
                Jurusan
              </label>
              <select
                id="jurusan"
                name="jurusan"
                value={formData.jurusan}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="" disabled>
                  Pilih jurusan
                </option>
                <option value="Teknik Informatika">Teknik Informatika</option>
                <option value="Sistem Informasi">Sistem Informasi</option>
                <option value="Teknik Elektro">Teknik Elektro</option>
                <option value="Teknik Sipil">Teknik Sipil</option>
                <option value="Manajemen">Manajemen</option>
                <option value="Akuntansi">Akuntansi</option>
                <option value="Hukum">Hukum</option>
                <option value="Kedokteran">Kedokteran</option>
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-bold mb-1">
                Konfirmasi Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-yellow-400 text-black font-bold py-2 px-4 rounded-lg border-2 border-black hover:brightness-95 transition-all"
              style={{ boxShadow: "4px 4px 0px 0px rgba(0, 0, 0, 0.25)" }}
              disabled={isLoading}
            >
              {isLoading ? "Memproses..." : "Daftar"}
            </button>
          </form>

          <div className="text-center mt-4">
            <p className="text-sm">
              Sudah punya akun?{" "}
              <Link href="/login" className="text-blue-600 font-bold hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
