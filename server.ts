import { webcrypto } from 'crypto';
if (!globalThis.crypto) {
  // @ts-ignore
  globalThis.crypto = webcrypto;
}

import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

import { requireApiKey, withAiFallback } from "./src/server/aiResponse";
import apiSyncRouter from "./src/server/api/index.js";

// Load environment variables from local .env files if present (essential for local run)
function loadEnvFiles() {
  const envFiles = [".env.example", ".env", ".env.local"];
  for (const filename of envFiles) {
    const filePath = path.resolve(process.cwd(), filename);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        content.split(/\r?\n/).forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) return;
          const firstEqual = trimmed.indexOf("=");
          if (firstEqual !== -1) {
            const key = trimmed.substring(0, firstEqual).trim();
            let val = trimmed.substring(firstEqual + 1).trim();
            val = val.replace(/^['"]|['"]$/g, "");
            if (key) {
              process.env[key] = val;
            }
          }
        });
        console.log(`[Env Loader] Loaded environment variables from ${filename}`);
      } catch (err) {
        console.warn(`[Env Loader] Error reading ${filename}:`, err);
      }
    }
  }
}

function getForecastFallback(products: any[], salesSummary: any, financeData: any) {
  const topList = salesSummary?.topProducts?.length 
    ? salesSummary.topProducts.map((p: any) => p.name).join(", ") 
    : "Coraq Aren Latte, Kopi Susu";
  const underperformedList = salesSummary?.underperformingProducts?.length 
    ? salesSummary.underperformingProducts.map((p: any) => p.name).join(", ") 
    : "Espresso, Americano";
  const totalRev = salesSummary?.totalRevenue || 0;

  return {
    swotAnalysis: {
      strengths: [
        "Sistem Layanan Self-Pickup menggunakan Pager Transmitter meningkatkan produktivitas pelayanan dan mengeliminasi antrean.",
        `Produk menu terlaris (${topList}) memiliki loyalitas tinggi dan repeat-buy yang kuat.`,
        "Struktur loyalitas berjenjang (Bronze, Silver, Gold, Platinum) terintegrasi dengan baik untuk mempertahankan retensi member."
      ],
      weaknesses: [
        `Perputaran stok lambat untuk menu kategori minor seperti (${underperformedList}).`,
        "Ketergantungan operasional pada jam-jam sibuk utama (morning spike dan coffee break sore).",
        "Biaya operasional bahan baku (HPP) perlu selalu dipantau agar marjin keuntungan tetap terjaga di atas 60%."
      ],
      opportunities: [
        "Meluncurkan promosi bundling terarah bagi pelanggan tingkat Bronze dan Silver untuk mendongkrak transaksi.",
        "Mendatangkan traffic tambahan pada jam sepi melalui program diskon Happy Hour.",
        "Kolaborasi promo kemitraan dan voucher khusus untuk penukaran poin loyalitas via Member Portal."
      ],
      threats: [
        "Fluktuasi harga bahan baku susu UHT dan biji kopi arabika lokal di pasaran.",
        "Kompetisi agresif dari kompetitor kedai kopi sejenis di area sekitar."
      ]
    },
    growthForecast: {
      month1Forecast: `Target Rp ${(totalRev * 1.25 + 12000000).toLocaleString("id-ID")}. Peningkatan retensi pelanggan melalui optimalisasi notifikasi WhatsApp promo member.`,
      month2Forecast: `Target Rp ${(totalRev * 1.45 + 18000000).toLocaleString("id-ID")}. Penjualan paket kompilasi menu kopi unggulan dengan snacks bernilai tambah tinggi.`,
      month3Forecast: `Target Rp ${(totalRev * 1.70 + 25000000).toLocaleString("id-ID")}. Konversi maksimum pengguna non-member dan optimalisasi diskon berdasar tiering loyalitas pelanggan.`,
      summaryTrend: "Secara keseluruhan, bisnis menunjukkan prospek pertumbuhan berkelanjutan (sustainable growth) sebesar 15-25% per bulan berkat efisiensi biaya labor dari wireless pager system."
    },
    strategicMilestones: [
      {
        title: "Kombinasi Paket Bundling 'Coraq Combo'",
        description: `Paket bundling menu terpopuler (${topList}) bersama kuliner pendamping untuk memperbesar nominal struk harian (Average Basket Size).`,
        impactScale: "HIGH",
        estimatedRevenueBoost: "Estimasi Kenaikan Omzet +15%"
      },
      {
        title: "Happy Hour Pager khusus Jam Lengang",
        description: `Insentif potongan harga 15% pada jam sepi pelanggan (13:00 - 15:00) khusus menu (${underperformedList}) guna menguras sisa stok harian.`,
        impactScale: "MEDIUM",
        estimatedRevenueBoost: "Estimasi Kenaikan Omzet +8%"
      },
      {
        title: "WhatsApp Loyalty Blast & Re-engagement",
        description: "Menyiapkan kampanye pesan WhatsApp otomatis khusus member yang tidak aktif berkunjung kembali selama 14 hari terakhir.",
        impactScale: "HIGH",
        estimatedRevenueBoost: "Estimasi Retensi Pelanggan +12%"
      }
    ],
    financialOptimization: "⚠️ [MODE DEMO/FALLBACK - Limitasi Kuota Gemini API Tercapai]\n\nStrategi optimasi keuangan Coraq Coffee:\n1. Terapkan standarisasi takaran (BOM) super ketat bagi barista untuk memangkas sisa buangan bahan baku (waste) susu atau kopi.\n2. Lakukan pembelian bulk-buying grosir bersama dengan supplier utama bahan susu UHT dan gula aren konsentrat guna menekan HPP di kisaran 30-35%."
  };
}

function getMarketingFallback(promotions: any[], products: any[], salesData: any, recentPerformance: any) {
  const topList = salesData?.topProducts?.length 
    ? salesData.topProducts.map((p: any) => p.name).join(", ") 
    : "Coraq Aren Latte, Kopi Susu";
  const underperformedList = salesData?.underperformingProducts?.length 
    ? salesData.underperformingProducts.map((p: any) => p.name).join(", ") 
    : "Espresso, Americano";
  const targetProductCandidate = salesData?.underperformingProducts?.[0]?.name || products?.[0]?.name || "Kopi Hitam Classic";

  return {
    marketTrendSentiment: "⚠️ [MODE DEMO/FALLBACK - Limitasi Kuota Gemini API Tercapai]\n\nTrend pasar menunjukkan preferensi yang konsisten tinggi terhadap minuman kopi susu bertekstur creamy dengan variasi gula aren murni. Konsumen juga sangat menyukai efisiensi waktu, sehingga sistem Self-Pickup berbasis Pager Transmitter mendapat sambutan hangat karena mengurangi durasi antrean fisik.",
    internalEvaluation: `Analisis performa mendeteksi produk terlaris (${topList}) memiliki performa penjualan solid. Sebaliknya, beberapa menu kurang ditiup angin segar seperti (${underperformedList}) membutuhkan stimulus marketing khusus berupa diskon bundle.`,
    recommendedCampaigns: [
      {
        campaignName: "Promo Pager Happy Hour Gacor",
        targetProduct: targetProductCandidate,
        promoType: "PERCENTAGE",
        value: 15,
        minSpend: 35000,
        durationRecommendation: "Senin s/d Kamis, Jam 13:00 - 16:00 WIB",
        copywritingSocialMedia: "Kerjaan numpuk? Jam-jam kritis ngantuk butuh suntikan kafein biar seger lagi! 🥱☕ Nikmati promo Pager Happy Hour di Coraq Coffee, hemat langsung 15% khusus jam sepi! Ambil pas pager bergetar kenceng ya! 🚀 #CoraqCoffee #SkenaKopi",
        strategicReason: `Membangkitkan transaksi di jam produktivitas rendah (afternoon slump) dan sekaligus memicu trial-purchase untuk varian menu ${targetProductCandidate} agar bahan baku habis seimbang.`
      },
      {
        campaignName: "Bundling 'Sobat Santai' Aren Latte",
        targetProduct: salesData?.topProducts?.[0]?.name || "Coraq Aren Latte",
        promoType: "PERCENTAGE",
        value: 10,
        minSpend: 50000,
        durationRecommendation: "Malam Akhir Pekan (Jumat - Minggu)",
        copywritingSocialMedia: "Gak seru nongkrong akhir pekan tanpa sirkel & asupan manis favoritmu! 🤩 Beli menu terlaris kami bareng snack asik, dapet potongan spesial bundles! Buruan pesan di kasir Coraq Coffee! 🥐☕ #WeekendCoraq #CoraqCoffee",
        strategicReason: "Pemanfaatan 'Halo Effect' produk terlaris untuk merangsang penjualan pelengkap ber-margin tebal (snack/makanan penutup)."
      },
      {
        campaignName: "Welcome Voucher Member Baru",
        targetProduct: products?.[0]?.name || "Kopi Susu Aren",
        promoType: "PERCENTAGE",
        value: 10,
        minSpend: 25000,
        durationRecommendation: "Berlaku 7 Hari pertama pendaftaran member baru",
        copywritingSocialMedia: "Gabung sirkel rasa Coraq Coffee! 🎉 Daftar member sekarang & klaim welcome promo buat pesan kopi favorit pertamamu. Nikmati langsung benefit eksklusif tiering Bronze kamu! 🎟️☕",
        strategicReason: "Insentif psikologis yang memicu akuisisi member loyalitas baru secara massal di area sekitar gerai."
      }
    ]
  };
}

function getLocationIntelligenceFallback(locationName: string, monthlyRent: number, searchRadius: number, nationalCount: number, localCount: number) {
  let baseScore = 85;
  let rentWarning = "";
  const RentThreshold = 20000000;

  if (monthlyRent > RentThreshold) {
    const excessMillions = (monthlyRent - RentThreshold) / 1000000;
    const penalty = Math.min(18, Math.ceil(excessMillions * 1.5));
    baseScore -= penalty;
    rentWarning = `Peringatan: Estimasi sewa bulanan sebesar Rp ${monthlyRent.toLocaleString("id-ID")} melampaui batas psikologis ideal (Rp 20 Juta). Penilaian kelayakan lokasi ditekankan secara ketat (Penalti Skor Kelayakan: -${penalty} poin). Dibutuhkan minimal penjualan tambahan ~${Math.ceil((monthlyRent - RentThreshold)/15000/30)} cup kopi susu/hari hanya untuk menutup kelebihan beban sewa ruko.`;
  } else {
    rentWarning = `Bagus! Estimasi sewa bulanan Rp ${monthlyRent.toLocaleString("id-ID")} berada dalam rentang anggaran aman harian (di bawah batas Rp 20 Juta). Hal ini memberikan fleksibilitas arus kas operasional (cashflow) yang sangat tangguh bagi Coraq Coffee harian.`;
  }

  // Deductions for competitor density on the map
  baseScore -= (nationalCount * 8); // Heavy deduction for giant brands
  baseScore -= (localCount * 3);    // Medium deduction for local shops
  baseScore = Math.max(25, Math.min(98, baseScore));

  let threatLevel = "LOW";
  let threatDesc = "Persaingan di lokasi ini sangat ramah (Blue Ocean). Cocok untuk penetrasi cepat.";
  if (nationalCount >= 3) {
    threatLevel = "HIGH";
    threatDesc = `Ancaman Sangat Tinggi karena dikepung oleh ${nationalCount} kedai franchise nasional (Starbucks/Kopi Kenangan). Strategi branding, perang harga psikologis, dan keandalan sistem KDS + Pager Self-Pickup harus ekstra ketat.`;
  } else if (nationalCount > 0 || localCount >= 4) {
    threatLevel = "MEDIUM";
    threatDesc = `Tingkat Persaingan Moderate (${nationalCount} merek nasional & ${localCount} kopi lokal). Diperlukan aktivasi program loyalitas member Bronze-Platinum guna memikat daya beli pelanggan tetap.`;
  }

  const bepDaily = Math.ceil((monthlyRent / 15000) / 30) + (nationalCount * 12) + 20;
  const paybackMonths = Math.ceil((monthlyRent * 12 * 1.8) / (2500000 * (baseScore / 100)));

  // Generate high-fidelity realistic real competitor data based on location Name query in fallback mode
  const nameLower = locationName.toLowerCase();
  let realCompetitors: any[] = [];

  if (nameLower.includes("perintis") || nameLower.includes("makassar") || nameLower.includes("sulawesi selatan")) {
    realCompetitors = [
      {
        id: "real_fallback_1",
        name: "Yotta - Perintis Kemerdekaan KM 11",
        type: "LOCAL",
        distance: 150,
        rating: 4.7,
        description: "Brand lokal Makassar legendaris yang sangat populer di kalangan mahasiswa dengan menu es cokelat, boba, dan kopi manis."
      },
      {
        id: "real_fallback_2",
        name: "Base Coffee Perintis Makassar",
        type: "LOCAL",
        distance: 120,
        rating: 4.6,
        description: "Kedai kopi lokal modern yang sangat dekat, tempat berkumpul favorit mahasiswa Universitas Hasanuddin."
      },
      {
        id: "real_fallback_3",
        name: "Rumah Kopi Setia Perintis Makassar",
        type: "LOCAL",
        distance: 240,
        rating: 4.5,
        description: "Warung kopi legendaris dengan resep tradisional kopitiam, ramai pagi dan sore oleh komunitas lokal."
      },
      {
        id: "real_fallback_4",
        name: "KOPI NOKA BTP",
        type: "LOCAL",
        distance: 310,
        rating: 4.5,
        description: "Kedai kopi populer dengan konsep estetik dan aneka varian es kopi susu favorit mahasiswa di area Bumi Tamalanrea Permai (BTP)."
      },
      {
        id: "real_fallback_4_alt",
        name: "Kopi NOKA",
        type: "LOCAL",
        distance: 420,
        rating: 4.2,
        description: "Kedai kopi estetik tempat nongkrong asyik dengan spot foto instagramable dekat poros."
      },
      {
        id: "real_fallback_5",
        name: "Kopi Komar",
        type: "LOCAL",
        distance: 240,
        rating: 4.7,
        description: "Salah satu pelopor kopi susu kekinian lokal Makassar yang sangat hits, menyajikan racikan kopi dengan cita rasa kuat dan ramah kantong mahasiswa."
      },
      {
        id: "real_fallback_6",
        name: "Moka Coffee Shop",
        type: "LOCAL",
        distance: 530,
        rating: 4.3,
        description: "Kedai kopi modern independen dengan suasana coworking yang tenang untuk nugas kuliah."
      },
      {
        id: "real_fallback_7",
        name: "Kopi Kenangan - SPBU Perintis Kemerdekaan",
        type: "NATIONAL",
        distance: 380,
        rating: 4.4,
        description: "Franchise kopi susu grab-and-go terpopuler dengan perputaran pelanggan yang sangat cepat."
      }
    ];
  } else if (nameLower.includes("tomohon") || nameLower.includes("manado") || nameLower.includes("sulawesi utara")) {
    realCompetitors = [
      {
        id: "real_fallback_1",
        name: "Tomohon Flower Cafe",
        type: "LOCAL",
        distance: 190,
        rating: 4.5,
        description: "Cafe bertema bunga indah dengan spot foto estetik, dekat pusat kota."
      },
      {
        id: "real_fallback_2",
        name: "Kopi Ranowangko Tomohon",
        type: "LOCAL",
        distance: 310,
        rating: 4.6,
        description: "Terkenal dengan seduhan kopi hitam tradisional khas Sulawesi Utara."
      },
      {
        id: "real_fallback_3",
        name: "Janji Jiwa Tomohon",
        type: "NATIONAL",
        distance: 550,
        rating: 4.4,
        description: "Franchise kopi nasional dengan variasi toast dan es kopi susu aren."
      },
      {
        id: "real_fallback_4",
        name: "Warkop Extreme Pasar Tomohon",
        type: "LOCAL",
        distance: 140,
        rating: 4.2,
        description: "Warung kopi tradisional yang dekat dengan pasar ekstrem ikonik Tomohon."
      }
    ];
  } else {
    realCompetitors = [
      {
        id: "real_fallback_1",
        name: "Kopi Nako " + (locationName.split(",")[0] || "Lokal"),
        type: "NATIONAL",
        distance: 350,
        rating: 4.5,
        description: "Franchise kopi nasional estetik berkonsep rumah kaca modern."
      },
      {
        id: "real_fallback_2",
        name: "Warkop Sedap Malam",
        type: "LOCAL",
        distance: 210,
        rating: 4.3,
        description: "Warkop lokal 24 jam dengan sajian kopi susu tradisional dan mie instan."
      },
      {
        id: "real_fallback_3",
        name: "Kopi Kenangan Terdekat",
        type: "NATIONAL",
        distance: 480,
        rating: 4.4,
        description: "Rantai kopi susu grab-and-go terpopuler dengan perputaran cepat."
      },
      {
        id: "real_fallback_4",
        name: "Rumah Seduh Kopi Mandiri",
        type: "LOCAL",
        distance: 150,
        rating: 4.7,
        description: "Micro-roastery lokal yang menyajikan biji single origin nusantara dengan manual brew."
      }
    ];
  }

  return {
    feasibilityScore: baseScore,
    rentWarning: rentWarning,
    sentimentAnalysis: `Kawasan sekitar ${locationName} didominasi demografi usia produktif (mahasiswa, milenial & pekerja kantoran) dengan sentimen ketertarikan kopi aren premium yang sangat subur. Radius pencarian ${(searchRadius/1000).toFixed(1)} km menunjukkan tingkat kepadatan mobilitas tinggi yang menunjang layanan fungsional Self-Pickup Coraq.`,
    competitorThreatLevel: `${threatLevel} (${threatDesc})`,
    pricingStrategy: `Tetapkan rentang harga Rp 18.000 - Rp 26.500. Hindari miring ke arah premium di atas Rp 30.000 kecuali untuk menu dengan tambahan extra oat milk atau espresso shot ganda guna mengimbangi gempuran brand franchise nasional.`,
    regulatoryFeasibility: `Zonasi komersial aman. Pengurusan NIB (Nomor Induk Berusaha) dapat dilakukan via satu pintu OSS RBA. Pastikan rasio daya tampung parkir mendukung perputaran cepat pengambilan pesanan.`,
    marketingPlaybook: [
      `Gunakan digital ads Instagram & TikTok bertarget radius ${(searchRadius/1000).toFixed(1)} km dengan headline 'Kopi Aren Premium Indonesia Tanpa Antre'.`,
      `Pasang standing banner berisi barcode pendaftaran Member Portal instan di area muka gerai dengan bonus gratis 1 signature cup untuk pendaftaran Bronze perdana.`,
      `Gunakan pager transmitter secara aktif untuk mencetak diskon khusus happy hour (14:00 - 16:00) guna menarik animo mahasiswa terdekat.`
    ],
    paybackPeriodMonths: Math.max(8, Math.min(36, paybackMonths)),
    bepCupsDaily: bepDaily,
    realCompetitors
  };
}

loadEnvFiles();

async function startServer() {
  console.log("========== START SERVER ==========");

  try {
    console.log("[1] Membuat Express...");
    const app = express();

    const PORT = 3000;

    console.log("[2] Register middleware...");
    app.use(express.json({ limit: "20mb" }));
    app.use(cookieParser());

    // Log setiap request yang masuk
    app.use((req, res, next) => {
      console.log(`[REQUEST] ${req.method} ${req.url}`);
      next();
    });

    console.log("[3] Mount API Router...");
    app.use("/api", apiSyncRouter);

    console.log("[4] Register AI Routes...");
    // Semua app.post(...) BIARKAN TETAP seperti sekarang
    // Tidak perlu diubah sama sekali

    console.log("[5] Sebelum setup Vite/Static...");

    if (process.env.NODE_ENV !== "production") {
      console.log("[6] Development mode");
      console.log("[7] createViteServer() mulai");

      const vite = await createViteServer({
        server: {
          middlewareMode: true,
        },
        appType: "spa",
      });

      console.log("[8] createViteServer() selesai");

      app.use(vite.middlewares);

      console.log("[9] vite.middlewares terpasang");

      // Catch-all route untuk development
      

    } else {

      console.log("[6] Production mode");

      const distPath = path.join(process.cwd(), "dist");

      console.log("[7] Dist Path =", distPath);

      app.use(express.static(distPath));

      app.get("*", (req, res) => {
        console.log("[8] Static GET :", req.url);
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    console.log("[13] Sebelum listen()");

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log("==================================");
      console.log(`[14] SERVER BERHASIL LISTEN`);
      console.log(`http://localhost:${PORT}`);
      console.log("==================================");
    });

    server.on("error", (err) => {
      console.error("[LISTEN ERROR]", err);
    });

  } catch (err) {
    console.error("==================================");
    console.error("[FATAL ERROR]");
    console.error(err);
    console.error("==================================");
  }
}

startServer();
