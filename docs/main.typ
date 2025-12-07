#set page(margin: auto)
#set text(size: 12pt, font: "Times New Roman")
#set par(justify: true)

*Nama : Rynofaldi Damario Dzaki*

*NRP : 5025231042*

*Kelas : PBKK (D)*

= Penjelasan Penyelesaian TODO

== I. Sisi Backend (NestJS) Otorisasi dan Signature URL
#v(5pt)
Tujuan di sisi backend adalah mengubah server menjadi signing authority (otoritas penanda tangan) daripada menjadi file receiver.


1. s3.module.ts: Penyediaan Konfigurasi
  - Perubahan: Menambahkan ConfigModule ke imports.
  - Dampak: Memastikan S3Service mendapatkan akses ke ConfigService untuk membaca konfigurasi sensitif seperti AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, dan AWS_S3_BUCKET_NAME dari lingkungan (.env file).

2. s3.service.ts: Logika Generasi Presigned URL
  - Konstruktor (constructor):
    - Detail: Menginisialisasi S3Client menggunakan kredensial yang diambil dari ConfigService.
    - Konfigurasi MinIO: Menggunakan endpoint khusus (AWS_S3_ENDPOINT) dan menetapkan forcePathStyle: true. Ini krusial karena MinIO seringkali memerlukan penamaan bucket dalam path URL, bukan subdomain, agar permintaan PUT berhasil.

  - Metode generatePresignedUrl(fileExtension, contentType):
    - Penamaan Objek: Membuat Key S3 unik (imagePath) dengan format `posts/${randomUUID()}.${fileExtension}`. Key ini adalah nama file yang akan digunakan S3/MinIO.
    - Otorisasi Tindakan: Membuat PutObjectCommand. Ini adalah instruksi spesifik yang memberi tahu S3/MinIO: "Izinkan operasi PUT (unggah) ke Bucket ini, dengan Key ini, dan hanya jika content type-nya adalah yang ditentukan (contentType)".
    - Penandatanganan: Memanggil getSignedUrl(this.s3Client, command, { expiresIn: 3600 }). Fungsi ini menghasilkan URL otorisasi yang mencakup query parameters seperti tanda tangan (X-Amz-Signature), expiration time, dan access key. URL ini berlaku selama 1 jam (3600 detik) untuk satu kali operasi PUT saja.

3. s3.controller.ts: Endpoint Presigned URL
  - Metode `generatePresignedUrl(@Body() dto: GeneratePresignedUrlDto)`:
    - Akses Terproteksi: Dilindungi oleh `@UseGuards(JwtAuthGuard)` untuk memastikan hanya pengguna yang telah login yang dapat meminta URL.
    - Input Validasi: Menerima fileExtension dan contentType dari request body. Data ini diteruskan ke service untuk menghasilkan Key yang benar dan mengotorisasi tipe file.
    - Peran: Bertindak sebagai gateway yang merutekan permintaan otorisasi dari frontend ke S3Service.

== II. Sisi Frontend (Next.js/React)
#v(5pt)
Pada new.tsx, logika handleSubmit yang lama (menggunakan FormData ke /upload) harus digantikan sepenuhnya dengan alur dua langkah utama: mendapatkan otorisasi, lalu mengunggah (upload).

- 1. new.tsx: Metode handleImageChange
  - Detail Implementasi TODO: Bagian ini diselesaikan untuk memastikan pengalaman pengguna yang baik dan mencegah memory leak.
    - Pengelolaan imagePreview: Sebelum membuat preview baru, ia memanggil URL.revokeObjectURL(imagePreview) pada preview lama. Ini penting untuk membebaskan memori yang dialokasikan browser untuk URL sementara.

- 2. new.tsx: Metode handleSubmit (Menggantikan Multer Logic)
Blok TODO dalam handleSubmit yang sebelumnya melakukan POST ke /upload menggunakan FormData kini diubah menjadi langkah-langkah berikut:

  - Langkah 1: Mendapatkan Otorisasi Unggah (Presigned URL)
    - Aksi: Klien membuat permintaan POST ke endpoint baru /s3/presigned-url.
    - Payload: Mengirimkan metadata file (fileExtension dan contentType) dari imageFile.
    - Hasil: Menerima uploadUrl (URL S3 yang ditandatangani) dan imagePath (Key S3/MinIO).

  - Langkah 2: Unggah Langsung ke S3/MinIO
    - Aksi: Klien membuat permintaan PUT langsung ke uploadUrl.
    - Body: Body permintaan adalah objek imageFile mentah itu sendiri.
    - Header: Header Content-Type Wajib disetel agar sesuai dengan tipe MIME file (misalnya, image/png) yang diotorisasi oleh PutObjectCommand di backend.
    - Manfaat: Data file melewati server NestJS sepenuhnya, mengurangi load dan bandwidth server.

  - Langkah 3: Finalisasi Post
    - Aksi: Setelah unggahan ke S3 berhasil, klien membuat permintaan POST ke endpoint /posts.
    - Payload: Mengirimkan content dan imagePath (Key S3 yang didapat dari Langkah 1).
    - Dampak: Backend sekarang hanya perlu menyimpan imagePath ini di database (misalnya, MongoDB atau PostgreSQL), dan ketika post disajikan, link gambar akan mengarah ke alamat MinIO/S3, bukan ke path lokal server.
#v(5pt)
== III. Sisi Backend (NestJS): Kode Multer yang Diabaikan
#v(5pt)
- upload.controller.ts & upload.module.ts: Mengandung logika Multer (FileInterceptor, diskStorage, validasi mimetype dan filesize 5MB). Endpoint /upload ini tidak lagi dipanggil oleh new.tsx dalam alur Presigned URL yang baru.

- main.ts: Kode app.useStaticAssets melayani file dari disk lokal ./uploads. Jika tidak ada lagi gambar lokal yang disimpan atau disajikan, kode ini bisa dihapus. Namun, seringkali dipertahankan untuk melayani aset statis lainnya atau gambar lama.

= Multer Local Storage vs S3 Presigned URL
#v(5pt)
1. Multer Local Storage (Unggah melalui Server Aplikasi)
Kelebihan (Pros):

  - Sederhana untuk Proyek Kecil: Sangat mudah diatur dan diimplementasikan untuk proyek proof-of-concept atau aplikasi dengan lalu lintas rendah.

  - Akses Lokal Cepat: File langsung disimpan di disk server, yang dapat mempercepat akses jika server juga melayani file tersebut.

  - Kontrol Penuh Server: Server aplikasi memiliki kontrol penuh atas proses I/O file dan validasi real-time sebelum file disimpan.

Kekurangan (Cons):

  - Beban Server Tinggi: Semua data file (misalnya, gambar 5MB) harus melewati bandwidth server NestJS. Ini meningkatkan beban CPU dan memori server aplikasi.

  - Skalabilitas Buruk: Sulit untuk di-skalakan. Ketika menggunakan banyak instance server (horizontal scaling), Anda memerlukan sistem penyimpanan file terdistribusi (seperti NFS atau volume bersama) agar semua instance dapat mengakses file yang sama.

  - Risiko Single Point of Failure (SPOF): Jika disk server penuh atau rusak, data unggahan akan hilang atau proses unggah terhenti.

  - Tidak Ideal untuk Produksi: Server aplikasi tidak seharusnya bertanggung jawab untuk tugas penyimpanan statis.
#v(5pt)
2. S3 Presigned URLs (Unggah Langsung ke S3/MinIO)
Kelebihan (Pros):

  - Skalabilitas Tak Terbatas: S3 adalah layanan penyimpanan objek yang dirancang untuk skalabilitas dan daya tahan yang masif. Kapasitas penyimpanan hampir tidak terbatas.

  - Mengurangi Beban Server: Unggahan file dilakukan langsung dari klien (browser) ke S3/MinIO. Server aplikasi (NestJS) hanya bertindak untuk menghasilkan URL otorisasi, mengurangi beban CPU dan penggunaan bandwidth secara drastis.

  - Keandalan dan Daya Tahan: S3/MinIO menawarkan redundansi data dan ketersediaan yang sangat tinggi, meminimalkan risiko kehilangan data.
  - Kinerja Klien Lebih Cepat: Klien dapat mengunggah file langsung ke infrastruktur CDN/Edge S3 yang dioptimalkan.

Kekurangan (Cons):

  - Kompleksitas Implementasi: Membutuhkan penyiapan yang lebih rumit, termasuk konfigurasi S3 SDK, manajemen kunci (Access/Secret Key), dan penanganan alur multi-step pada frontend.

  - Biaya (untuk AWS S3): Ada biaya terkait penyimpanan, transfer data out, dan operasi request ke S3. (Meskipun MinIO sering digunakan sebagai alternatif self-hosted yang lebih murah).

  - Logika Frontend Lebih Kompleks: Klien harus menjalankan dua request terpisah (Request Presigned URL ke API, lalu PUT file ke S3).

=== Kriteria dan Analisis
Secara fundamental, pemilihan antara Multer Local Storage dan S3 Presigned URLs terletak pada perbedaan arsitektur: Multer mewakili pendekatan tradisional unggah melalui server, sedangkan S3 Presigned URLs mewakili pendekatan modern unggah langsung dari klien.

  - Beban dan Skalabilitas Server: Pendekatan Multer Local Storage secara signifikan membebani server aplikasi NestJS. Setiap byte file harus melewati server, menghabiskan bandwidth dan siklus CPU, sehingga buruk untuk skalabilitas. Sebaliknya, S3 Presigned URLs memindahkan beban I/O file langsung ke infrastruktur S3/MinIO yang terdedikasi. Server NestJS hanya terlibat dalam otorisasi ringan, memungkinkan horizontal scaling yang jauh lebih baik dan efisien.

  - Keandalan dan Ketersediaan: Penyimpanan lokal (local storage) rentan terhadap kegagalan disk dan memerlukan solusi terpisah yang kompleks (seperti NFS) untuk redundancy di lingkungan multi-server. S3, sebagai layanan penyimpanan objek terkelola, menawarkan keandalan dan ketersediaan tinggi secara out-of-the-box, meminimalkan risiko kehilangan data.

  - Kinerja: Meskipun Multer cepat untuk proof-of-concept, kinerja unggah global akan jauh lebih baik menggunakan S3/MinIO, karena mereka dirancang untuk throughput tinggi dan dapat memanfaatkan jaringan edge (CDN).

=== Kesimpulan
S3 Presigned URLs adalah solusi yang jauh lebih unggul dan direkomendasikan untuk aplikasi web modern yang berorientasi pada produksi dan skalabilitas.

Menggunakan S3 Presigned URLs memungkinkan server aplikasi (NestJS) untuk berfokus pada logika bisnis inti, bukan pada I/O file yang memakan sumber daya. Meskipun membutuhkan implementasi awal yang sedikit lebih kompleks di frontend (proses dua langkah: meminta URL lalu mengunggah), manfaatnya—terutama dalam hal pengurangan beban server dan kemampuan untuk berkembang tanpa batas—secara substansial melebihi kompleksitas awal tersebut. Multer Local Storage sebaiknya hanya dipertimbangkan untuk proyek yang sangat kecil atau lingkungan pengembangan lokal.

== Hasil Testing
#v(5pt)
#image("image1.png")
#image("image2.png")