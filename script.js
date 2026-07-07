// === PASTE URL FIREBASE REALTIME DATABASE DI SINI ===
const URL_DATABASE = "https://boxbot-edu-default-rtdb.asia-southeast1.firebasedatabase.app/daftar_pemain.json";

// Variabel State (Penyimpanan Status UI)
let dataMentah = [];
let kataKunci = "";

// Default Sort: Berdasarkan Nama, A-Z (Ascending)
let kolomSortAktif = "nama";
let sortAscending = true; 

// Default Pagination
let halamanSaatIni = 1;
const batasDataPerHalaman = 30;

// 1. FUNGSI MENARIK DATA DARI FIREBASE
async function AmbilDataFirebase() {
    try {
        const response = await fetch(URL_DATABASE);
        const data = await response.json();
        
        // Cek apakah data ada (tidak null)
        if (data) {
            // Firebase mengembalikan Object, bukan Array.
            // Gunakan Object.values(data) untuk merakit ulang Object tersebut menjadi Array
            // agar fitur Search, Sort, dan Pagination di bawahnya tetap berfungsi normal!
            dataMentah = Object.values(data);
            RenderTabel();
        } else {
            // Jika database benar-benar kosong
            dataMentah = [];
            RenderTabel();
        }
    } catch (error) {
        console.error("Gagal memuat data Firebase:", error);
    }
}

// 2. FUNGSI PENCARIAN
function TerapkanPencarian() {
    kataKunci = document.getElementById("input-search").value.toLowerCase();
    halamanSaatIni = 1; 
    RenderTabel();
}

// 3. FUNGSI PENGURUTAN
function AturSort(kolom) {
    if (kolomSortAktif === kolom) {
        sortAscending = !sortAscending;
    } else {
        kolomSortAktif = kolom;
        sortAscending = true;
    }
    RenderTabel();
}

// 4. FUNGSI PAGINATION
function UbahHalaman(arah) {
    halamanSaatIni += arah;
    RenderTabel();
}
// Fungsi pembantu untuk menentukan teks progres berdasarkan level
function DapatkanTeksProgres(level) {
    if (level === 1) {
        return `<span class="badge-belum">Belum dimainkan</span>`;
    } else if (level >= 4) {
        return `<span class="badge-tuntas">Tuntas</span>`;
    } else {
        let levelTerkini = level-1;
        // Menampilkan Level 2 atau Level 3 sesuai progres berjalan
        return `<span class="badge-bintang">Lvl ${levelTerkini}</span>`;
    }
}
// 5. FUNGSI RENDER TABEL
function RenderTabel() {
    let dataTampil = [...dataMentah];

    // --- TAHAP A: FILTER PENCARIAN ---
    if (kataKunci !== "") {
        dataTampil = dataTampil.filter(p => {
            const nama = (p.nama_siswa || "").toLowerCase();
            const kelas = (p.kelas || "").toLowerCase();
            return nama.includes(kataKunci) || kelas.includes(kataKunci);
        });
    }

    // --- TAHAP B: PENGURUTAN (SORTING) ---
    dataTampil.sort((a, b) => {
        let nilaiA, nilaiB;

        if (kolomSortAktif === "nama") {
            nilaiA = (a.nama_siswa || "").toLowerCase();
            nilaiB = (b.nama_siswa || "").toLowerCase();
        } else if (kolomSortAktif === "kelas") {
            nilaiA = (a.kelas || "").toLowerCase();
            nilaiB = (b.kelas || "").toLowerCase();
        } else if (kolomSortAktif === "waktu") {
            nilaiA = a.terakhir_main || "";
            nilaiB = b.terakhir_main || "";
        } else if (kolomSortAktif === "prisma") {
            nilaiA = a.pencapaian_level?.prisma_segitiga?.level_tertinggi || 1;
            nilaiB = b.pencapaian_level?.prisma_segitiga?.level_tertinggi || 1;
        } 
        else if (kolomSortAktif === "kubus") {
            nilaiA = a.pencapaian_level?.kubus?.level_tertinggi || 1;
            nilaiB = b.pencapaian_level?.kubus?.level_tertinggi || 1;
        }
        else if (kolomSortAktif === "balok") {
            nilaiA = a.pencapaian_level?.balok?.level_tertinggi || 1;
            nilaiB = b.pencapaian_level?.balok?.level_tertinggi || 1;
        }
        else if (kolomSortAktif === "limas") {
            nilaiA = a.pencapaian_level?.limas?.level_tertinggi || 1;
            nilaiB = b.pencapaian_level?.limas?.level_tertinggi || 1;
        }
        else if (kolomSortAktif === "tabung") {
            nilaiA = a.pencapaian_level?.tabung?.level_tertinggi || 1;
            nilaiB = b.pencapaian_level?.tabung?.level_tertinggi || 1;
        }
        else if (kolomSortAktif === "kerucut") {
            nilaiA = a.pencapaian_level?.kerucut?.level_tertinggi || 1;
            nilaiB = b.pencapaian_level?.kerucut?.level_tertinggi || 1;
        }
        else if (kolomSortAktif === "bola") {
            nilaiA = a.pencapaian_level?.bola?.level_tertinggi || 1;
            nilaiB = b.pencapaian_level?.bola?.level_tertinggi || 1;
        }

        if (nilaiA < nilaiB) return sortAscending ? -1 : 1;
        if (nilaiA > nilaiB) return sortAscending ? 1 : -1;
        return 0;
    });

    // --- TAHAP C: PAGINATION ---
    const totalData = dataTampil.length;
    const totalHalaman = Math.ceil(totalData / batasDataPerHalaman) || 1;
    
    if (halamanSaatIni > totalHalaman) halamanSaatIni = totalHalaman;
    if (halamanSaatIni < 1) halamanSaatIni = 1;

    const indexMulai = (halamanSaatIni - 1) * batasDataPerHalaman;
    const dataHalamanIni = dataTampil.slice(indexMulai, indexMulai + batasDataPerHalaman);

    // --- TAHAP D: RENDER KE HTML ---
    const tabelBody = document.getElementById("tabel-body");
    tabelBody.innerHTML = "";

    if (dataHalamanIni.length === 0) {
        tabelBody.innerHTML = `<tr><td colspan="6" class="text-kosong">Tidak ada data ditemukan.</td></tr>`;
    } else {
        dataHalamanIni.forEach((pemain, index) => {
            const nomorUrut = indexMulai + index + 1;
            
            // Ambil angka level asli dari database (default 1 jika null)
            const prismaLvlRaw = pemain.pencapaian_level?.prisma_segitiga?.level_tertinggi || 1;
            const kubusLvlRaw = pemain.pencapaian_level?.kubus?.level_tertinggi || 1;
            const balokLvlRaw = pemain.pencapaian_level?.balok?.level_tertinggi || 1;
            const limasLvlRaw = pemain.pencapaian_level?.limas?.level_tertinggi || 1;
            const tabungLvlRaw = pemain.pencapaian_level?.tabung?.level_tertinggi || 1;
            const kerucutLvlRaw = pemain.pencapaian_level?.kerucut?.level_tertinggi || 1;
            const bolaLvlRaw = pemain.pencapaian_level?.bola?.level_tertinggi || 1;
            
            // Ubah angka tersebut menjadi elemen badge text menggunakan fungsi pembantu kita
            const kolomPrisma = DapatkanTeksProgres(prismaLvlRaw);
            const kolomKubus = DapatkanTeksProgres(kubusLvlRaw);
            const kolomBalok = DapatkanTeksProgres(balokLvlRaw);
            const kolomLimas = DapatkanTeksProgres(limasLvlRaw);
            const kolomTabung = DapatkanTeksProgres(tabungLvlRaw);
            const kolomKerucut = DapatkanTeksProgres(kerucutLvlRaw);
            const kolomBola = DapatkanTeksProgres(bolaLvlRaw);
            
            let waktuFormat = "-";
            if(pemain.terakhir_main) {
                // Konversi paksa tanda titik (.) menjadi titik dua (:) agar terbaca oleh browser
                let waktuAman = pemain.terakhir_main.replace(/\./g, ':');
                
                const dateObj = new Date(waktuAman);
                
                // Pastikan hasilnya bukan Invalid Date sebelum dicetak
                if (!isNaN(dateObj)) {
                    waktuFormat = dateObj.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
                } else {
                    waktuFormat = "Format Waktu Rusak";
                }
            }

            const row = document.createElement("tr");
            row.innerHTML = `
                <td style="color: #888;">${nomorUrut}</td>
                <td style="font-weight: bold; color: #111;">${pemain.nama_siswa || 'Tanpa Nama'}</td>
                <td>${pemain.kelas || '-'}</td>
                <td style="font-size: 13px; color: #666;">${waktuFormat}</td>
                <td>${kolomPrisma}</td>
                <td>${kolomKubus}</td>
                <td>${kolomBalok}</td>
                <td>${kolomLimas}</td>
                <td>${kolomTabung}</td>
                <td>${kolomKerucut}</td>
                <td>${kolomBola}</td>
            `;
            tabelBody.appendChild(row);
        });
    }

    // --- TAHAP E: UPDATE UI ---
    document.getElementById("info-data").innerText = `Menampilkan ${dataHalamanIni.length} dari total ${totalData} siswa`;
    document.getElementById("info-halaman").innerText = `Halaman ${halamanSaatIni} dari ${totalHalaman}`;
    
    document.getElementById("btn-prev").disabled = (halamanSaatIni === 1);
    document.getElementById("btn-next").disabled = (halamanSaatIni === totalHalaman);

    document.querySelectorAll(".sort-icon").forEach(el => el.innerText = "");
    
    const ikonAktif = document.getElementById("icon-" + kolomSortAktif);
    if(ikonAktif) ikonAktif.innerText = sortAscending ? "▲" : "▼";
}

// Inisialisasi awal
AmbilDataFirebase();

// Refresh data otomatis setiap 3 detik
setInterval(AmbilDataFirebase, 3000);