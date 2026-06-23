// === PASTE URL FIREBASE REALTIME DATABASE DI SINI ===
const URL_DATABASE = "https://boxbot-edu-default-rtdb.asia-southeast1.firebasedatabase.app/data_boxbot.json";

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
        
        if (data && data.daftar_pemain) {
            dataMentah = data.daftar_pemain;
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
        } else if (kolomSortAktif === "kubus") {
            nilaiA = a.pencapaian_level?.kubus?.level_tertinggi || 1;
            nilaiB = b.pencapaian_level?.kubus?.level_tertinggi || 1;
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
            const prismaLvl = pemain.pencapaian_level?.prisma_segitiga?.level_tertinggi || 1;
            const kubusLvl = pemain.pencapaian_level?.kubus?.level_tertinggi || 1;
            
            let waktuFormat = "-";
            if(pemain.terakhir_main) {
                const dateObj = new Date(pemain.terakhir_main);
                waktuFormat = dateObj.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
            }

            const row = document.createElement("tr");
            row.innerHTML = `
                <td style="color: #888;">${nomorUrut}</td>
                <td style="font-weight: bold; color: #111;">${pemain.nama_siswa || 'Tanpa Nama'}</td>
                <td>${pemain.kelas || '-'}</td>
                <td style="font-size: 13px; color: #666;">${waktuFormat}</td>
                <td><span class="badge-bintang">★ Lvl ${prismaLvl}</span></td>
                <td><span class="badge-bintang">★ Lvl ${kubusLvl}</span></td>
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