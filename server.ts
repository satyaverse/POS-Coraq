import express from "express";
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
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "20mb" }));

  // AI Forecasting & Strategic Business Analyst Endpoint
  app.post("/api/analytics/ai-forecast", async (req, res) => {
    try {
      const { products, salesSummary, financeData } = req.body;
      const apiKey = requireApiKey();

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `
        Anda berperan sebagai CFO & Ahli Strategi Bisnis FnB (Coffee Shop) Senior khusus untuk Coraq Coffee.
        Lakukan analisis bisnis mendalam dan proyeksikan ramalan bisnis ke depan (financial forecasting) serta susun rencana aksi prioritas (Strategic Roadmap) agar kedai kopi kami dapat melipatgandakan omzet hingga skala maksimal memanfaatkan teknologi Self-Pickup Pager.

        Gunakan Google Search untuk mendapatkan trend FnB terbaru, inovasi menu kopi kekinian, viral marketing, dan strategi penetrasi pasar paling teruji tahun ini (${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}).

        Detail Operasional Saat Ini:
        - Nama: Coraq Coffee
        - Sistem Layanan: Self-Pickup dengan pager transmitter (kecepatan, praktis, & mengurangi labor cost).
        - Target Market: Pekerja kantoran, mahasiswa, dan penikmat kopi premium dengan mobilitas tinggi.

        Menu & Harga Tersedia:
        ${JSON.stringify(products?.slice(0, 30) || [], null, 2)}

        Rangkuman Kinerja Penjualan Saat Ini:
        - Total Transaksi Teranalisis: ${salesSummary?.totalOrders || 0}
        - Estimasi Omset / Revenue: Rp ${salesSummary?.totalRevenue || 0}
        - Item Terlaris (Hero Items): ${JSON.stringify(salesSummary?.topProducts || [])}
        - Item Kurang Laris (Underperforming): ${JSON.stringify(salesSummary?.underperformingProducts || [])}

        Kondisi Finansial / Pengeluaran Terdaftar:
        - Total Pengeluaran Tambahan (Expenses/HPP): Rp ${financeData?.totalExpenses || 0}

        TUGAS ANDA:
        Berikan laporan proyeksi bisnis 3 bulan ke depan, SWOT analitik, langkah taktis menumbuhkan omzet, serta tips menekan HPP bahan baku.
        Skema output HARUS berupa JSON valid dengan format berikut:

        {
          "swotAnalysis": {
            "strengths": ["Kekuatan utama kedai kopi kami..."],
            "weaknesses": ["Kelemahan atau area perbaikan operasional..."],
            "opportunities": ["Peluang market potensial berdasarkan trend kopi terkini..."],
            "threats": ["Ancaman eksternal (kompetisi, harga komoditas)..."]
          },
          "growthForecast": {
            "month1Forecast": "Prediksi & target omzet bulan ke-1 beserta alasannya",
            "month2Forecast": "Prediksi & target omzet bulan ke-2 dengan eskalasi promosi",
            "month3Forecast": "Prediksi & target omzet bulan ke-3 mencapai puncak baru",
            "summaryTrend": "Rincian tren pertumbuhan jangka menengah dan panjang secara kualitatif."
          },
          "strategicMilestones": [
            {
              "title": "Judul Langkah Taktis (Contoh: Rekayasa Menu Bundling & Up-selling)",
              "description": "Langkah konkret yang harus dieksekusi",
              "impactScale": "HIGH atau MEDIUM",
              "estimatedRevenueBoost": "Estimasi kenaikan omzet (contoh: Kenaikan +15% per bulan)"
            }
          ],
          "financialOptimization": "Strategi konkret mengoptimalkan HPP (BOM) & konversi bahan baku tanpa menurunkan citarasa premium khas Coraq."
        }

        Tuliskan analisis dalam bahasa Indonesia yang berwibawa, profesional, terstruktur, serta memberikan optimisme tinggi bagi pemilik usaha (Super Admin/Owner).
      `;

      const aiCall = () => ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });

      const fallbackFn = () => getForecastFallback(products || [], salesSummary || {}, financeData || {});

      const result = await withAiFallback(aiCall, fallbackFn, "Proyeksi Finansial AI");

      res.json({
        forecast: result.data,
        sources: result.sources,
        isFallback: result.isFallback,
        error: result.error
      });
    } catch (error: any) {
      console.error("Gemini Forecast Route Exception Error:", error);
      res.status(500).json({ error: error.message || "Gagal memproses ramalan bisnis." });
    }
  });

  // AI Marketing Recommendation Route with Grounded Web Search & Internal Analytics
  app.post("/api/marketing/ai-analyze", async (req, res) => {
    try {
      const { promotions, products, salesData, recentPerformance } = req.body;
      const apiKey = requireApiKey();

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Construct dynamic prompt containing internal menu, existing promos, and current performance metrics
      const prompt = `
        Analisis promosi & marketing taktis yang inovatif untuk kedai kopi kami, "Coraq Coffee".
        Gunakan Google Search untuk mendapatkan trend FnB, trend kopi kekinian, viral, fomo-marketing, dan campaign kreatif yang sangat relevan saat ini (${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}).

        Identitas Kedai:
        - Nama: Coraq Coffee
        - Target Market: Anak muda, milenial, mahasiswa, pekerja kreatif (skena kopi premium-minimalis, self-pickup pager).

        Menu Produk Tersedia:
        ${JSON.stringify(products?.slice(0, 30) || [], null, 2)}

        Promosi Saat Ini:
        ${JSON.stringify(promotions || [], null, 2)}

        Kilas Kinerja Penjualan / Data Internal (Mendukung Evaluasi Menu Lesu vs Menu Sukses):
        ${JSON.stringify(recentPerformance || {}, null, 2)}
        Total Transaksi Teranalisis: ${salesData?.totalOrders || 0}
        Produk Terlaris (Hero Items): ${JSON.stringify(salesData?.topProducts || [])}
        Produk Kurang Laris (Lesu, perlu dorongan promo): ${JSON.stringify(salesData?.underperformingProducts || [])}

        TUGAS ANDA:
        Berikan laporan analisis taktis mendalam, inovatif, dan siap eksekusi dalam format JSON yang valid.
        JSON HARUS memiliki skema berikut (harap kembalikan HANYA JSON tanpa tambahan teks markdown pembungkus di luar JSON jika memungkinkan, atau kembalikan JSON murni):

        {
          "marketTrendSentiment": "Analisis singkat sentimen market & trend kopi viral/fomo terbaru saat ini berdasarkan pencarian Google.",
          "internalEvaluation": "Evaluasi perilaku penjualan kita. Analisis mengapa produk terlaris laku dan bagaimana cara mengangkat produk yang lesu.",
          "recommendedCampaigns": [
             {
               "campaignName": "Nama Campaign/Promo Taktis yang Gacor & FOMO",
               "targetProduct": "Produk target (pilih dari Menu Produk Tersedia, terutama untuk mendongkrak produk lesu)",
               "promoType": "PERCENTAGE atau FIXED atau HAPPY_HOUR atau BUNDLE",
               "value": 15, // representasi angka presentase diskon atau potongan harga (Rupiah)
               "minSpend": 35000, // representasi nominal rupiah min belanja
               "durationRecommendation": "Contoh: Setiap Jumat - Minggu, Jam 13:00 - 17:00",
               "copywritingSocialMedia": "Ide caption medsos dan hook FOMO yang menarik minat anak skena saat ini.",
               "strategicReason": "Alasan strategis mengapa promo ini cocok berdasarkan trend market terkini dan data internal."
             }
          ]
        }

        Kembalikan output dalam bahasa Indonesia yang keren, profesional, dan sedikit santai ala barista kopi kekinian. Pastikan JSON ini valid secara sintaksis.
      `;

      const aiCall = () => ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });

      const fallbackFn = () => getMarketingFallback(promotions || [], products || [], salesData || {}, recentPerformance || {});

      const result = await withAiFallback(aiCall, fallbackFn, "Marketing Analysis AI");

      res.json({
        recommendation: result.data,
        sources: result.sources,
        isFallback: result.isFallback,
        error: result.error
      });


    } catch (error: any) {
      console.error("Gemini Analyze Route Exception Error:", error);
      res.status(500).json({ error: error.message || "Gagal memproses analisis pemasaran." });
    }
  });

  // Coraq Location Intelligence (CLI) Geospatial Analyzer Endpoint
  app.post("/api/marketing/location-analyze", async (req, res) => {
    try {
      const { locationName, monthlyRent, searchRadius, nationalCompetitorsCount, localCompetitorsCount, menuSummary } = req.body;
      let apiKey;
      
      try {
        apiKey = requireApiKey();
      } catch (err) {
        console.warn("⚠️ No GEMINI_API_KEY found, running fallback automatically.");
        const fallbackData = getLocationIntelligenceFallback(locationName, monthlyRent, searchRadius, nationalCompetitorsCount, localCompetitorsCount);
        return res.json({
          forecast: fallbackData,
          sources: [{ title: "Mode Analitik Lokal (Model Fallback Coraq Coffee)", uri: "#" }],
          isFallback: true
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

      const rentThreshold = 20000000;
      const prompt = `
        Anda adalah Analis Ekspansi & Geospatial Real Estate Retail FnB Senior khusus untuk pasar kedai kopi Indonesia (Coraq Coffee).
        Lakukan studi kelayakan (Feasibility Study) mendalam secara spasial untuk potensi target lokasi baru berikut:

        Profil Lokasi Baru:
        - Nama Kawasan: ${locationName}
        - Estimasi Biaya Sewa Bulanan: Rp ${monthlyRent.toLocaleString("id-ID")}
        - Batas Ideal Anggaran Sewa: Rp ${rentThreshold.toLocaleString("id-ID")} (Jika harga sewa melampaui batas ini, Anda harus sangat ketat mendenda penalti skor & memberikan peringatan risiko margin sewa overhead).
        - Radius Pencarian Pesaing harian: ${searchRadius} meter

        TUGAS UTAMA (SANGAT CRITICAL):
        Gunakan Google Search Grounding untuk mencari daftar kompetitor kedai kopi, coffee shop, warkop, kopitiam, cafe, atau brand kopi nasional/lokal (khususnya merek populer Indonesia seperti Yotta, KOPI NOKA BTP, Kopi Komar, Moka Coffee, Starbucks, Kopi Kenangan, Janji Jiwa, Point Coffee, dll) RIIL yang berada secara geografis di sekitar kawasan "${locationName}".
        Suku kata kunci pencarian yang relevan: "coffee shop dekat ${locationName}", "warung kopi di sekitar ${locationName}", "cafe terdekat dari ${locationName}", "Yotta dekat ${locationName}", "KOPI NOKA BTP dekat ${locationName}", "Kopi Komar dekat ${locationName}".

        Misalkan, jika kawasan pencarian adalah "Jalan Perintis Kemerdekaan KM 11 Makassar" atau "BTP Makassar", temukan kompetitor riil yang ada di sepanjang jalan tersebut, contohnya brand lokal Makassar terlaris "Yotta", brand lokal "KOPI NOKA BTP", brand "Kopi Komar", serta kompetitor mandiri seperti "Base Coffee" dan "Rumah Kopi Setia".

        Harap kumpulkan minimal 4 hingga 8 kompetitor kopi riil terdekat dari hasil pencarian Google Search Grounding Anda. Saring dan pastikan nama kedai adalah yang paling akurat dari search results. Hal ini krusial agar data analisis bersifat nyata dan berdaya guna tinggi bagi mitra waralaba.

        Keluarkan output analisis harus berupa JSON murni dengan format template wajib berikut (harus persis):

        {
          "feasibilityScore": 75, // Skor angka bulat antara 20 - 98. Lakukan diskon ketat jika biaya sewa di atas 20 juta/bulan, atau jika pesaing nasional tinggi!
          "rentWarning": "Tulis penjelasan detail pro/kontra estimasi sewa tempat dibanding batas aman 20 juta/bulan harian.",
          "sentimentAnalysis": "Tulis 3-4 kalimat ulasan sentimen ketertarikan pasar dan demografi sirkel di wilayah ini terhadap kopi aren fungsional.",
          "competitorThreatLevel": "MEDIUM (Ancaman menengah. Jelaskan bagaimana taktik menandingi brand nasional & lokal di area ini berdasarkan daftar pesaing riil yang ditemukan).",
          "pricingStrategy": "Tulis saran strategi penentuan harga menu yang pas untuk kawasan ini.",
          "regulatoryFeasibility": "Tulis ulasan izin usaha mikro (NIB, OSS) dan tata ruang wilayah tersebut.",
          "marketingPlaybook": [
            "Langkah aksi promo 1 khusus di lokasi ini",
            "Langkah aksi promo 2 khusus di lokasi ini",
            "Langkah aksi promo 3 khusus di lokasi ini"
          ],
          "paybackPeriodMonths": 15, // Angka bulat perkiraan modal awal kembali (ROI) dalam bulan.
          "bepCupsDaily": 85, // Estimasi berapa cup terjual per hari agar impas ongkos sewa.
          "realCompetitors": [
            {
              "id": "real_comp_1",
              "name": "Nama Kedai Kopi Riil Yang Ditemukan", // Misal: "Base Coffee Perintis" atau "Starbucks Coffee - Makassar Town Square"
              "type": "NATIONAL", // Gunakan "NATIONAL" untuk franchise besar nasional/global (Starbucks, Kopi Kenangan, Janji Jiwa, Point Coffee, Excelso, dll), atau "LOCAL" untuk kedai kopi mandiri, warkop tradisional, atau cafe lokal independen.
              "distance": 220, // Jarak estimasi dalam meter dari lokasi target (integer antara 50 - 1500)
              "rating": 4.5, // Rating ulasan riil yang tercantum di web (jika tidak ada, buat perkiraan rasional antara 4.1 s.d. 4.8)
              "description": "Deskripsi singkat mengenai kedai kopi ini yang didapatkan dari info pencarian (misal: 'Ramai dikunjungi mahasiswa Unhas', 'Konsep outdoor estetik')"
            }
          ]
        }

        Kembalikan output murni JSON bahasa Indonesia yang berwibawa, analitis, matematis dan realistis. Jangan menyertakan blok kode markdown.
      `;

      const aiCall = () => ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });

      const fallbackFn = () => getLocationIntelligenceFallback(locationName, monthlyRent, searchRadius, nationalCompetitorsCount, localCompetitorsCount);

      const result = await withAiFallback(aiCall, fallbackFn, "Location Intelligence AI");

      res.json({
        forecast: result.data,
        sources: result.sources,
        isFallback: result.isFallback,
        error: result.error
      });

    } catch (error: any) {
      console.error("Gemini CLI Route Exception Error:", error);
      res.status(500).json({ error: error.message || "Gagal memproses analisis lokasi." });
    }
  });

  // Vite middleware or Static files serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
