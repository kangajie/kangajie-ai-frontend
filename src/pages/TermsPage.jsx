import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-ink px-4 py-10 md:py-16">
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-yellow-500 transition mb-8"
        >
          <i className="fa-solid fa-arrow-left" />
          Kembali ke KangAjie AI
        </Link>

        {/* Header */}
        <div className="w-14 h-14 bg-gradient-to-br from-[#1A1A1C] to-[#0F0F10] rounded-2xl flex items-center justify-center mb-6 border border-[#333]">
          <i className="fa-solid fa-file-contract text-2xl text-yellow-500" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
          Syarat & Ketentuan
        </h1>
        <p className="text-gray-500 text-sm mb-10">Berlaku efektif sejak 14 Juli 2026</p>

        {/* Content */}
        <div className="space-y-8 text-sm leading-relaxed text-gray-300">
          <section>
            <p>
              Dengan mengakses atau menggunakan KangAjie AI ("layanan") di
              <span className="text-white"> ai.kangajie.my.id </span>,
              Anda setuju untuk terikat dengan Syarat & Ketentuan ini. Jika Anda tidak setuju, mohon untuk tidak
              menggunakan layanan ini.
            </p>
          </section>

          <section>
            <h2 className="text-lg mb-3 text-white">1. Deskripsi Layanan</h2>
            <p>
              KangAjie AI adalah asisten percakapan berbasis kecerdasan buatan yang membantu Anda mencari
              informasi, menulis kode, menganalisis dokumen, dan tugas lain melalui percakapan teks.
            </p>
          </section>

          <section>
            <h2 className="text-lg mb-3 text-white">2. Akun Pengguna</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>
                Anda dapat menggunakan layanan sebagai Tamu (tanpa akun) dengan fitur terbatas, atau membuat
                akun melalui email/password maupun Sign in with Google.
              </li>
              <li>Anda bertanggung jawab menjaga kerahasiaan kredensial akun Anda.</li>
              <li>Anda wajib memberikan informasi yang benar saat mendaftar.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg mb-3 text-white">3. Penggunaan yang Wajar</h2>
            <p>Anda setuju untuk tidak menggunakan layanan ini untuk:</p>
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li>Melakukan kegiatan ilegal atau melanggar hukum yang berlaku.</li>
              <li>Menghasilkan konten yang melecehkan, memfitnah, atau berbahaya bagi pihak lain.</li>
              <li>Mencoba mengeksploitasi, meretas, atau mengganggu keamanan dan kestabilan layanan.</li>
              <li>Menyalahgunakan layanan untuk spam atau otomatisasi massal tanpa izin.</li>
            </ul>
            <p className="mt-3">
              Kami berhak menangguhkan atau menghapus akun yang melanggar ketentuan ini.
            </p>
          </section>

          <section>
            <h2 className="text-lg mb-3 text-white">4. Batasan Tanggung Jawab atas Konten AI</h2>
            <p>
              Jawaban yang dihasilkan oleh AI dapat mengandung kesalahan, ketidakakuratan, atau informasi yang
              sudah usang. Layanan ini <span className="text-white">bukan pengganti</span> nasihat profesional
              (medis, hukum, keuangan, dsb). Anda bertanggung jawab penuh atas keputusan yang diambil
              berdasarkan hasil dari layanan ini.
            </p>
          </section>

          <section>
            <h2 className="text-lg mb-3 text-white">5. Hak Kekayaan Intelektual</h2>
            <p>
              Konten yang Anda unggah tetap menjadi milik Anda. Kami tidak mengklaim kepemilikan atas isi
              percakapan atau file yang Anda unggah, dan hanya menggunakannya untuk memproses permintaan Anda
              sebagaimana dijelaskan dalam
              <Link to="/privacy" className="text-accent hover:underline">
                Kebijakan Privasi
              </Link>
              kami.
            </p>
          </section>

          <section>
            <h2 className="text-lg mb-3 text-white">6. Ketersediaan Layanan</h2>
            <p>
              Kami berupaya menjaga layanan tetap tersedia, namun tidak menjamin layanan akan berjalan tanpa
              gangguan, bebas error, atau tersedia setiap saat. Kami dapat mengubah, menangguhkan, atau
              menghentikan sebagian maupun seluruh fitur layanan kapan saja tanpa pemberitahuan sebelumnya.
            </p>
          </section>

          <section>
            <h2 className="text-lg mb-3 text-white">7. Perubahan Ketentuan</h2>
            <p>
              Kami dapat memperbarui Syarat & Ketentuan ini dari waktu ke waktu. Perubahan berlaku sejak tanggal
              dipublikasikan pada halaman ini. Penggunaan layanan secara berkelanjutan berarti Anda menyetujui
              perubahan tersebut.
            </p>
          </section>

          <section>
            <h2 className="text-lg mb-3 text-white">8. Kontak</h2>
            <p>
              Jika Anda memiliki pertanyaan mengenai Syarat & Ketentuan ini, silakan hubungi kami di
              <a href="mailto:roifanmarzuki@gmail.com" className="text-accent hover:underline">
                roifanmarzuki@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
