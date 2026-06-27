import React, { useState, useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { useStore } from "../../context/StoreContext";
import { 
  MapPin, 
  Search, 
  Sliders, 
  Building, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle, 
  Map as MapIcon, 
  Plus, 
  Trash2, 
  Sparkles, 
  DollarSign, 
  ShieldAlert, 
  ChevronRight, 
  RefreshCw,
  BookOpen,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Globe,
  Navigation
} from "lucide-react";

interface Competitor {
  id: string;
  name: string;
  type: "NATIONAL" | "LOCAL";
  distance: number; // in meters
  angle: number; // angle in degrees for visual mapping
  rating: number;
  description?: string;
}

interface PresetLocation {
  name: string;
  defaultRent: number;
  nationalCount: number;
  localCount: number;
  sentiment: "POSITIF" | "NETRAL" | "NEGATIF";
  baseCompetitors: Competitor[];
  lat: number;
  lng: number;
  // SVG coordinates/paths simulating actual streets & geography from mockup
  riverPath: string;
  mainRoadPath: string;
  secondaryRoads: string[];
  unhasLakeCircle: { cx: number; cy: number; r: number };
  landmarks: { name: string; x: number; y: number; type: "education" | "commercial" | "nature" | "general" }[];
}

const PRESET_LOCATIONS: PresetLocation[] = [
  {
    name: "Tamalanrea, Makassar",
    defaultRent: 14000000,
    nationalCount: 3,
    localCount: 4,
    sentiment: "POSITIF",
    lat: -5.1348,
    lng: 119.4894,
    baseCompetitors: [
      { id: "m1", name: "KOPI NOKA BTP", type: "LOCAL", distance: 310, angle: 45, rating: 4.5, description: "Kedai kopi populer dengan konsep estetik dan aneka varian es kopi susu favorit mahasiswa di area Bumi Tamalanrea Permai (BTP)." },
      { id: "m2", name: "Kopi NOKA", type: "LOCAL", distance: 420, angle: 120, rating: 4.2, description: "Kedai kopi estetik tempat nongkrong asyik dengan spot foto instagramable dekat poros." },
      { id: "m3", name: "Yotta - Perintis Kemerdekaan KM 11", type: "LOCAL", distance: 150, angle: 300, rating: 4.7, description: "Brand lokal Makassar legendaris terpopuler di kalangan mahasiswa dengan menu es cokelat dan boba." },
      { id: "m4", name: "Kopi Komar", type: "LOCAL", distance: 240, angle: 210, rating: 4.7, description: "Salah satu pelopor kopi susu kekinian lokal Makassar yang sangat hits, menyajikan racikan kopi creamy manis." },
      { id: "m5", name: "Starbucks Unhas", type: "NATIONAL", distance: 450, angle: 60, rating: 4.6, description: "Rantai gerai kopi global favorit mahasiswa Unhas untuk belajar kelompok." },
      { id: "m6", name: "Kopi Kenangan - SPBU Perintis", type: "NATIONAL", distance: 680, angle: 340, rating: 4.4, description: "Minuman kopi susu grab-and-go terpopuler dengan rasa aren legit." },
    ],
    // Precise layout replicating the user's mockup image (Tamalanrea)
    riverPath: "M-100,100 C-80,180 -50,300 -120,400 C-170,470 -220,500 -180,620 C-150,700 -50,850 -90,1000",
    mainRoadPath: "M-200,900 L1200,50",
    secondaryRoads: [
      "M200,100 L200,900", // Jl. Perintis Kemerdekaan/Telkomas
      "M450,150 Q550,500 800,850", // Secondary link
      "M-50,600 L600,550", // Jl. Pendidikan Unhas
    ],
    unhasLakeCircle: { cx: 220, cy: 720, r: 60 },
    landmarks: [
      { name: "Universitas Hasanuddin (Unhas)", x: 220, y: 640, type: "education" },
      { name: "Auditorium Prof. A. Amiruddin", x: 190, y: 550, type: "education" },
      { name: "Dermaga Kera-Kera / P. Lakkang", x: -90, y: 220, type: "nature" },
      { name: "Toko Bintang Tamalanrea", x: 420, y: 440, type: "commercial" },
      { name: "Masjid Jami Nurul Iman Telkomas", x: 670, y: 380, type: "general" },
      { name: "Telkomas Residential Gate", x: 880, y: 280, type: "general" },
      { name: "Laniang Waterboom", x: 850, y: 720, type: "nature" },
      { name: "Apotek Alvaran Farma", x: 620, y: 580, type: "commercial" },
      { name: "Bakso Jumbo CAK DEBBI", x: 910, y: 880, type: "commercial" }
    ],
  },
  {
    name: "Dago, Bandung",
    defaultRent: 18500000,
    nationalCount: 2,
    localCount: 5,
    sentiment: "POSITIF",
    lat: -6.8868,
    lng: 107.6153,
    baseCompetitors: [
      { id: "1", name: "Starbucks Dago", type: "NATIONAL", distance: 450, angle: 45, rating: 4.5 },
      { id: "2", name: "Kopi Kenangan Dago", type: "NATIONAL", distance: 850, angle: 120, rating: 4.3 },
      { id: "3", name: "Kopi Armor Dago", type: "LOCAL", distance: 300, angle: 210, rating: 4.6 },
      { id: "4", name: "Kedai Kopi Bahagia", type: "LOCAL", distance: 1200, angle: 280, rating: 4.2 },
      { id: "5", name: "Dago Coffee Craft", type: "LOCAL", distance: 950, angle: 340, rating: 4.4 },
    ],
    riverPath: "M-150,-10 L300,400 L450,1100",
    mainRoadPath: "M500,-100 L500,1100", // Jl. Ir. H. Juanda
    secondaryRoads: [
      "M-100,500 L1100,520", // Jl. Dayang Sumbi
      "M100,200 Q250,550 500,600", 
    ],
    unhasLakeCircle: { cx: 700, cy: 300, r: 40 },
    landmarks: [
      { name: "Simpang Dago", x: 500, y: 250, type: "commercial" },
      { name: "Kampus ITB Ganesha", x: 280, y: 520, type: "education" },
      { name: "Babakan Siliwangi Forest", x: 150, y: 380, type: "nature" },
      { name: "Dago Tea House", x: 600, y: 780, type: "education" },
    ],
  },
  {
    name: "Menteng, Jakarta Pusat",
    defaultRent: 35000000,
    nationalCount: 5,
    localCount: 3,
    sentiment: "POSITIF",
    lat: -6.2012,
    lng: 106.8315,
    baseCompetitors: [
      { id: "11", name: "Starbucks Reserve Menteng", type: "NATIONAL", distance: 250, angle: 30, rating: 4.7 },
      { id: "12", name: "Fore Coffee Menteng", type: "NATIONAL", distance: 600, angle: 100, rating: 4.4 },
      { id: "13", name: "Kopi Kenangan", type: "NATIONAL", distance: 900, angle: 180, rating: 4.2 },
      { id: "14", name: "Anomali Coffee", type: "NATIONAL", distance: 1100, angle: 240, rating: 4.5 },
      { id: "15", name: "Kedai Kopi Toko Djawa", type: "LOCAL", distance: 400, angle: 310, rating: 4.6 },
    ],
    riverPath: "M500,-200 L420,150 L560,400 L380,680 L500,1100", // Ciliwung River
    mainRoadPath: "M100,-100 L800,1000", // Jl. Sudirman
    secondaryRoads: [
      "M0,350 L1000,350", // Jl. HOS Cokroaminoto
      "M600,100 L200,900", 
    ],
    unhasLakeCircle: { cx: 480, cy: 520, r: 35 },
    landmarks: [
      { name: "Taman Menteng", x: 320, y: 320, type: "nature" },
      { name: "Taman Suropati", x: 580, y: 360, type: "nature" },
      { name: "Bundaran HI", x: 220, y: 150, type: "commercial" },
      { name: "Stasiun Menteng", x: 750, y: 800, type: "commercial" },
    ],
  },
  {
    name: "Kuta, Bali",
    defaultRent: 28000000,
    nationalCount: 3,
    localCount: 7,
    sentiment: "POSITIF",
    lat: -8.7228,
    lng: 115.1725,
    baseCompetitors: [
      { id: "21", name: "Starbucks Sunset Road", type: "NATIONAL", distance: 1200, angle: 60, rating: 4.5 },
      { id: "22", name: "Expat. Roast Kuta", type: "NATIONAL", distance: 800, angle: 150, rating: 4.7 },
      { id: "23", name: "Kopi Lokal Bali Brew", type: "LOCAL", distance: 350, angle: 220, rating: 4.4 },
      { id: "24", name: "Warung Kopi Bali", type: "LOCAL", distance: 200, angle: 320, rating: 4.3 },
    ],
    riverPath: "M-150,300 C50,400 300,300 450,550 C600,800 500,1100 400,1300", // Coastal Beach Outline
    mainRoadPath: "M100,-100 L350,1100", // Jl. Sunset Road
    secondaryRoads: [
      "M350,300 L950,550", // Jl. Raya Kuta
      "M100,600 L800,600",
    ],
    unhasLakeCircle: { cx: 120, cy: 820, r: 50 },
    landmarks: [
      { name: "Kuta Beachfront Coastline", x: 80, y: 480, type: "nature" },
      { name: "Beachwalk Shopping Center", x: 180, y: 320, type: "commercial" },
      { name: "Monumen Peringatan Bom Bali", x: 420, y: 550, type: "general" },
    ],
  },
  {
    name: "Gubeng, Surabaya",
    defaultRent: 15000000,
    nationalCount: 1,
    localCount: 4,
    sentiment: "NETRAL",
    lat: -7.2683,
    lng: 112.7668,
    baseCompetitors: [
      { id: "31", name: "Kopi Janji Jiwa Gubeng", type: "NATIONAL", distance: 750, angle: 90, rating: 4.1 },
      { id: "32", name: "Kedai Kopi Gubeng Pojok", type: "LOCAL", distance: 300, angle: 190, rating: 4.3 },
      { id: "33", name: "Coba Kopi Suroboyo", type: "LOCAL", distance: 600, angle: 290, rating: 4.4 },
    ],
    riverPath: "M-100,500 L1100,500", // Kalimas River running crosswise
    mainRoadPath: "M400,-100 L400,1100", // Jl. Raya Gubeng
    secondaryRoads: [
      "M0,250 L1000,250", 
      "M250,800 L850,800",
    ],
    unhasLakeCircle: { cx: 200, cy: 300, r: 30 },
    landmarks: [
      { name: "Stasiun Surabaya Gubeng", x: 400, y: 220, type: "commercial" },
      { name: "Monumen Kapal Selam", x: 280, y: 480, type: "nature" },
      { name: "Rumah Sakit Dr. Soetomo", x: 650, y: 750, type: "education" },
    ],
  },
  {
    name: "Margonda, Depok",
    defaultRent: 12000000,
    nationalCount: 4,
    localCount: 8,
    sentiment: "POSITIF",
    lat: -6.3719,
    lng: 106.8312,
    baseCompetitors: [
      { id: "41", name: "Starbucks Margonda", type: "NATIONAL", distance: 350, angle: 40, rating: 4.4 },
      { id: "42", name: "Kopi Kenangan Margonda", type: "NATIONAL", distance: 500, angle: 130, rating: 4.2 },
      { id: "43", name: "Janji Jiwa UI", type: "NATIONAL", distance: 1400, angle: 210, rating: 4.1 },
      { id: "44", name: "Walking Drums Margonda", type: "LOCAL", distance: 900, angle: 280, rating: 4.5 },
      { id: "45", name: "Kedai Kopi Rakyat", type: "LOCAL", distance: 250, angle: 330, rating: 4.3 },
    ],
    riverPath: "M-100,200 Q200,450 400,200 T900,500", // Ciliwung Depok
    mainRoadPath: "M500,-100 L500,1100", // Jl. Margonda Raya
    secondaryRoads: [
      "M-100,350 L1100,350", // Jl. Juanda Depok
      "M200,150 L800,950",
    ],
    unhasLakeCircle: { cx: 220, cy: 220, r: 70 }, // UI Lake
    landmarks: [
      { name: "Danau Kenanga Universitas Indonesia", x: 220, y: 220, type: "education" },
      { name: "Stasiun UI Depok", x: 480, y: 240, type: "commercial" },
      { name: "Margo City Mall", x: 500, y: 800, type: "commercial" },
      { name: "Depok Town Square (DETOS)", x: 420, y: 750, type: "commercial" },
    ],
  },
];

interface AddressSuggestion {
  name: string;
  rent: number;
  presetsMatching: string;
}

const ADDRESS_SUGGESTIONS: AddressSuggestion[] = [
  // Makassar
  { name: "Jl. Perintis Kemerdekaan KM.10, Tamalanrea, Makassar", rent: 14000000, presetsMatching: "Tamalanrea, Makassar" },
  { name: "Jl. Tamalanrea Raya (BTP) Blok M, Makassar", rent: 11000000, presetsMatching: "Tamalanrea, Makassar" },
  { name: "Jl. Pendidikan, Kampus Unhas, Makassar", rent: 12500000, presetsMatching: "Tamalanrea, Makassar" },
  { name: "Jl. Kera-Kera, Samping Unhas, Makassar", rent: 8500000, presetsMatching: "Tamalanrea, Makassar" },
  { name: "Jl. Poros Makassar - Maros, Tamalanrea, Makassar", rent: 16000000, presetsMatching: "Tamalanrea, Makassar" },
  { name: "Jl. Sultan Alauddin No. 105, Rappocini, Makassar", rent: 15000000, presetsMatching: "Tamalanrea, Makassar" },
  { name: "Jl. Boulevard Blok F-22, Panakkukang, Makassar", rent: 21000000, presetsMatching: "Tamalanrea, Makassar" },
  { name: "Jl. Hertasning Baru No. 89, Rappocini, Makassar", rent: 14000000, presetsMatching: "Tamalanrea, Makassar" },
  
  // Gowa
  { name: "Jl. Tun Abdul Razak (Dekat Citraland), Somba Opu, Gowa", rent: 12000000, presetsMatching: "Tamalanrea, Makassar" },
  { name: "Jl. Masjid Raya No. 42, Sungguminasa, Gowa", rent: 9000000, presetsMatching: "Tamalanrea, Makassar" },
  { name: "Jl. Sultan Hasanuddin No. 71, Sungguminasa, Gowa", rent: 10500000, presetsMatching: "Tamalanrea, Makassar" },

  // Maros
  { name: "Jl. Ahmad Yani (Area Kuliner PTB), Turikale, Maros", rent: 8500000, presetsMatching: "Tamalanrea, Makassar" },
  { name: "Jl. Jenderal Sudirman No. 15, Turikale, Maros", rent: 7800000, presetsMatching: "Tamalanrea, Makassar" },

  // Parepare & Palopo & Bone
  { name: "Jl. Jenderal Sudirman, Soreang, Parepare", rent: 9000000, presetsMatching: "Tamalanrea, Makassar" },
  { name: "Jl. Andi Djemma No. 88, Wara, Palopo", rent: 8200000, presetsMatching: "Tamalanrea, Makassar" },
  { name: "Jl. Besse Kajuara, Tanete Riattang, Bone", rent: 7500000, presetsMatching: "Tamalanrea, Makassar" },

  // Bulukumba, Toraja, Sidrap (Sulawesi Selatan)
  { name: "Jl. Lanto Daeng Pasewang No. 34, Ujung Bulu, Bulukumba", rent: 6800000, presetsMatching: "Tamalanrea, Makassar" },
  { name: "Jl. Jenderal Sudirman No. 8, Rantepao, Toraja Utara", rent: 7500000, presetsMatching: "Tamalanrea, Makassar" },
  { name: "Jl. Pongtiku No. 55, Makale, Tana Toraja", rent: 7000000, presetsMatching: "Tamalanrea, Makassar" },
  { name: "Jl. Jenderal Sudirman No. 23, Pangkajene, Sidrap", rent: 6500000, presetsMatching: "Tamalanrea, Makassar" },

  // Manado & Tomohon (Sulawesi Utara)
  { name: "Jl. Piere Tendean, Boulevard Mall Area, Manado", rent: 18000000, presetsMatching: "Tamalanrea, Makassar" },
  { name: "Jl. Sam Ratulangi No. 120, Wanea, Manado", rent: 15000000, presetsMatching: "Tamalanrea, Makassar" },
  { name: "Jl. Raya Tomohon, Kolongan, Tomohon Tengah", rent: 9500000, presetsMatching: "Tamalanrea, Makassar" },
  { name: "Jl. Wolter Monginsidi, Malalayang, Manado", rent: 11000000, presetsMatching: "Tamalanrea, Makassar" },

  // Palu, Poso, Luwuk (Sulawesi Tengah)
  { name: "Jl. Jenderal Sudirman No. 44, Palu Barat, Palu", rent: 11000000, presetsMatching: "Tamalanrea, Makassar" },
  { name: "Jl. Moh. Hatta No. 12, Lolu Utara, Palu", rent: 9000000, presetsMatching: "Tamalanrea, Makassar" },
  { name: "Jl. Pulau Sabang, Kawasan Pantai Poso, Poso", rent: 7200000, presetsMatching: "Tamalanrea, Makassar" },
  { name: "Jl. Trans Sulawesi (Kawasan Luwuk), Banggai", rent: 8500000, presetsMatching: "Tamalanrea, Makassar" },

  // Kendari, Baubau, Kolaka (Sulawesi Tenggara)
  { name: "Jl. H. Alala, Bypass Kendari Beach, Kendari", rent: 13000000, presetsMatching: "Tamalanrea, Makassar" },
  { name: "Jl. M.T. Haryono No. 89, Wuawua, Kendari", rent: 12000000, presetsMatching: "Tamalanrea, Makassar" },
  { name: "Jl. Sultan Hasanuddin No. 18, Batupoaro, Baubau", rent: 8000000, presetsMatching: "Tamalanrea, Makassar" },
  { name: "Jl. Pemuda No. 45, Kolaka, Sulawesi Tenggara", rent: 7800000, presetsMatching: "Tamalanrea, Makassar" },

  // Mamuju, Majene, Polewali (Sulawesi Barat)
  { name: "Jl. Yos Sudarso No. 10 (Samping Pantai Manakarra), Mamuju", rent: 8500000, presetsMatching: "Tamalanrea, Makassar" },
  { name: "Jl. Sultan Hasanuddin No. 32, Banggae, Majene", rent: 6200000, presetsMatching: "Tamalanrea, Makassar" },
  { name: "Jl. Jenderal Sudirman No. 15, Polewali, Polewali Mandar", rent: 7000000, presetsMatching: "Tamalanrea, Makassar" },

  // Gorontalo & Limboto
  { name: "Jl. Nani Wartabone No. 102, Limba U Dua, Kota Gorontalo", rent: 9500000, presetsMatching: "Tamalanrea, Makassar" },
  { name: "Jl. Reformasi, Kampus UNG, Kota Gorontalo", rent: 8500000, presetsMatching: "Tamalanrea, Makassar" },
  { name: "Jl. Jenderal Sudirman No. 45, Limboto, Kabupaten Gorontalo", rent: 7000000, presetsMatching: "Tamalanrea, Makassar" },

  // Bandung
  { name: "Jl. Ir. H. Juanda No. 120, Dago, Bandung", rent: 19000000, presetsMatching: "Dago, Bandung" },
  { name: "Jl. Dago Asri No. 15, Coblong, Bandung", rent: 14500000, presetsMatching: "Dago, Bandung" },
  { name: "Jl. Dayang Sumbi No. 8, Dago, Bandung", rent: 17000000, presetsMatching: "Dago, Bandung" },
  { name: "Jl. Dago Elos No. 45, Coblong, Bandung", rent: 12000000, presetsMatching: "Dago, Bandung" },
  { name: "Jl. Geger Kalong Hilir (Dekat UPI), Bandung", rent: 9800000, presetsMatching: "Dago, Bandung" },
  { name: "Jl. Cihampelas No. 101, Coblong, Bandung", rent: 18000000, presetsMatching: "Dago, Bandung" },
  { name: "Jl. Buah Batu Raya No. 240, Lengkong, Bandung", rent: 16000000, presetsMatching: "Dago, Bandung" },

  // Depok
  { name: "Jl. Margonda Raya No. 120, Beji, Depok", rent: 13000000, presetsMatching: "Margonda, Depok" },
  { name: "Jl. Akses UI, Kelapa Dua, Depok", rent: 9500000, presetsMatching: "Margonda, Depok" },
  { name: "Jl. Kompol DR. Double No. 5, Margonda, Depok", rent: 11000500, presetsMatching: "Margonda, Depok" },
  { name: "Jl. Raya Sawangan No. 41, Pancoran Mas, Depok", rent: 10000000, presetsMatching: "Margonda, Depok" },

  // Bogor
  { name: "Jl. Pajajaran No. 88, Bogor Tengah, Kota Bogor", rent: 19500000, presetsMatching: "Dago, Bandung" },
  { name: "Jl. Pandu Raya No. 15, Bogor Utara, Kota Bogor", rent: 15000000, presetsMatching: "Dago, Bandung" },
  { name: "Jl. Raya Dramaga No. 102 (Samping IPB), Bogor", rent: 11000000, presetsMatching: "Dago, Bandung" },

  // Bekasi
  { name: "Jl. Boulevard Raya Barat, Grand Galaxy, Kota Bekasi", rent: 16500000, presetsMatching: "Margonda, Depok" },
  { name: "Jl. KH. Noer Ali No. 22, Kalimalang, Kota Bekasi", rent: 18000000, presetsMatching: "Margonda, Depok" },

  // Jakarta Pusat
  { name: "Jl. Teuku Umar No. 10, Menteng, Jakarta Pusat", rent: 38000000, presetsMatching: "Menteng, Jakarta Pusat" },
  { name: "Jl. Cikini Raya No. 55, Menteng, Jakarta Pusat", rent: 29000000, presetsMatching: "Menteng, Jakarta Pusat" },
  { name: "Jl. Surabaya No. 12, Menteng, Jakarta Pusat", rent: 32000000, presetsMatching: "Menteng, Jakarta Pusat" },
  { name: "Jl. HOS Cokroaminoto No. 80, Menteng, Jakarta Pusat", rent: 42000000, presetsMatching: "Menteng, Jakarta Pusat" },
  { name: "Jl. Cempaka Putih Tengah No. 14, Jakarta Pusat", rent: 19500000, presetsMatching: "Menteng, Jakarta Pusat" },

  // Jakarta Selatan & Barat & Timur & Utara
  { name: "Jl. Kemang Raya No. 18, Mampang, Jakarta Selatan", rent: 35000000, presetsMatching: "Menteng, Jakarta Pusat" },
  { name: "Jl. Cipete Raya No. 10 (Samping Stasiun MRT), Jakarta Selatan", rent: 24000000, presetsMatching: "Menteng, Jakarta Pusat" },
  { name: "Jl. Tanjung Duren Raya No. 81, Grogol, Jakarta Barat", rent: 22000000, presetsMatching: "Menteng, Jakarta Pusat" },
  { name: "Jl. Balai Pustaka Timur No. 11, Rawamangun, Jakarta Timur", rent: 17500000, presetsMatching: "Menteng, Jakarta Pusat" },
  { name: "Jl. Boulevard Raya Blok LA-04, Kelapa Gading, Jakarta Utara", rent: 29000000, presetsMatching: "Menteng, Jakarta Pusat" },

  // Bali
  { name: "Jl. Sunset Road No. 88, Kuta, Bali", rent: 28000000, presetsMatching: "Kuta, Bali" },
  { name: "Jl. Raya Legian No. 105, Kuta, Bali", rent: 24000000, presetsMatching: "Kuta, Bali" },
  { name: "Jl. Pantai Kuta No. 12, Kuta, Bali", rent: 35000000, presetsMatching: "Kuta, Bali" },
  { name: "Jl. Teuku Umar No. 64, Denpasar Barat, Denpasar", rent: 18000000, presetsMatching: "Kuta, Bali" },
  { name: "Jl. Raya Ubud, Samping Pasar Ubud, Gianyar", rent: 22000000, presetsMatching: "Kuta, Bali" },
  { name: "Jl. Monkey Forest Road S-10, Ubud, Gianyar", rent: 26000000, presetsMatching: "Kuta, Bali" },

  // Surabaya
  { name: "Jl. Dharmahusada No. 112, Gubeng, Surabaya", rent: 16500000, presetsMatching: "Gubeng, Surabaya" },
  { name: "Jl. Raya Gubeng No. 40, Surabaya", rent: 18000000, presetsMatching: "Gubeng, Surabaya" },
  { name: "Jl. Manyar Kertoarjo, Gubeng, Surabaya", rent: 15000000, presetsMatching: "Gubeng, Surabaya" },
  { name: "Jl. Raya Darmo No. 88, Tegalsari, Surabaya", rent: 24000000, presetsMatching: "Gubeng, Surabaya" },
  
  // Malang & Sidoarjo & Kediri
  { name: "Jl. Tlogomas No. 24 (Dekat UMM), Lowokwaru, Malang", rent: 11500000, presetsMatching: "Gubeng, Surabaya" },
  { name: "Jl. Sukarno Hatta No. 45, Lowokwaru, Malang", rent: 14000000, presetsMatching: "Gubeng, Surabaya" },
  { name: "Jl. Raya Ponti No. 12 (Kawasan GOR), Sidoarjo", rent: 12500000, presetsMatching: "Gubeng, Surabaya" },
  { name: "Jl. Dhoho No. 102, Secang, Kota Kediri", rent: 11000000, presetsMatching: "Gubeng, Surabaya" },

  // Tangerang & Tangsel
  { name: "Jl. Margonda Raya, Beji (Samping Kampus UI), Depok", rent: 13000000, presetsMatching: "Margonda, Depok" },
  { name: "Jl. Cipondoh Indah No. 34, Tangerang", rent: 9500000, presetsMatching: "Margonda, Depok" },
  { name: "Jl. Kisamaun No. 55, Pasar Lama, Tangerang", rent: 15500000, presetsMatching: "Margonda, Depok" },
  { name: "Jl. Bintaro Utama Sektor 9 (Dekat Stasiun), Tangerang Selatan", rent: 19000000, presetsMatching: "Margonda, Depok" },
  { name: "Jl. Jenderal Sudirman No. 88, Serang, Banten", rent: 12000000, presetsMatching: "Margonda, Depok" }
];

interface SweetSpot {
  name: string;
  province: string;
  regency: string;
  rent: number;
  nationalCount: number;
  localCount: number;
  description: string;
  sentiment: "POSITIF" | "NETRAL" | "NEGATIF";
  presetMatching: string;
  competitors: Competitor[];
}

const SWEET_SPOTS: SweetSpot[] = [
  // SULAWESI SELATAN - KOTA MAKASSAR
  {
    province: "Sulawesi Selatan",
    regency: "Kota Makassar",
    name: "Kawasan Niaga Daya (Samping KTI), Makassar",
    rent: 11500000,
    nationalCount: 0,
    localCount: 2,
    sentiment: "POSITIF",
    presetMatching: "Tamalanrea, Makassar",
    description: "Kawasan industri padat mahasiswa & pekerja pabrik. Nol gerai kopi waralaba internasional (Starbucks/Kopi Kenangan) dalam radius 1.5km. Margin sewa ruko di bawah batas psikologis ruko Makassar.",
    competitors: [
      { id: "sw1", name: "Warkop Daya Nusantara", type: "LOCAL", distance: 400, angle: 90, rating: 4.2 },
      { id: "sw2", name: "Kopi Klasik Daya", type: "LOCAL", distance: 950, angle: 240, rating: 4.1 },
    ]
  },
  {
    province: "Sulawesi Selatan",
    regency: "Kota Makassar",
    name: "Jl. Hertasning Baru (Batas Gowa), Makassar",
    rent: 14000000,
    nationalCount: 1,
    localCount: 3,
    sentiment: "POSITIF",
    presetMatching: "Tamalanrea, Makassar",
    description: "Arus lalu lintas tinggi komuter Makassar-Gowa. Hanya terdapat satu minimarket kopi point. Belum ada penetrasi kafe dine-in estetik yang menawarkan sistem pager self-pickup.",
    competitors: [
      { id: "sw3", name: "Point Coffee Alfa", type: "NATIONAL", distance: 1200, angle: 120, rating: 4.3 },
      { id: "sw4", name: "Kopi Turatea Hertasning", type: "LOCAL", distance: 450, angle: 30, rating: 4.4 },
      { id: "sw5", name: "Warkop Ammago Gowa", type: "LOCAL", distance: 750, angle: 180, rating: 4.2 },
    ]
  },
  // SULAWESI SELATAN - KABUPATEN GOWA
  {
    province: "Sulawesi Selatan",
    regency: "Kabupaten Gowa",
    name: "Jl. Tun Abdul Razak (Teras Citraland), Gowa",
    rent: 12000000,
    nationalCount: 1,
    localCount: 2,
    sentiment: "POSITIF",
    presetMatching: "Tamalanrea, Makassar",
    description: "Koridor utama penghubung Makassar-Gowa kelas menengah ke atas. Sangat tinggi sirkulasi mobil harian keluarga muda, minim kedai kopi susu siap saji cepat.",
    competitors: [
      { id: "sw_gw1", name: "Warkop Gowa Indah", type: "LOCAL", distance: 600, angle: 80, rating: 4.1 },
      { id: "sw_gw2", name: "Kopi Kenangan Razak", type: "NATIONAL", distance: 1100, angle: 190, rating: 4.4 }
    ]
  },
  {
    province: "Sulawesi Selatan",
    regency: "Kabupaten Gowa",
    name: "Jl. Masjid Raya Samping Sungguminasa, Gowa",
    rent: 9000000,
    nationalCount: 0,
    localCount: 3,
    sentiment: "POSITIF",
    presetMatching: "Tamalanrea, Makassar",
    description: "Titik kumpul warga Sungguminasa yang sangat padat sore dan malam hari. Ketiadaan kompetitor kopi modern skala nasional dalam radius 1.2km menjadikannya peluang emas.",
    competitors: [
      { id: "sw_gw3", name: "Warkop Deng Gowa", type: "LOCAL", distance: 300, angle: 45, rating: 4.2 },
      { id: "sw_gw4", name: "Kedai Kopi Sunggu", type: "LOCAL", distance: 500, angle: 220, rating: 4.3 }
    ]
  },
  // SULAWESI SELATAN - KABUPATEN MAROS
  {
    province: "Sulawesi Selatan",
    regency: "Kabupaten Maros",
    name: "Taman Kuliner PTB (Pantai Tak Berombak), Maros",
    rent: 8500000,
    nationalCount: 0,
    localCount: 4,
    sentiment: "POSITIF",
    presetMatching: "Tamalanrea, Makassar",
    description: "Pusat rekreasi kuliner terbuka andalan warga lokal Maros. Ribuan anak muda berkumpul setiap sore-malam. Mayoritas warkop tradisional tanpa sistem pager self-pickup modern.",
    competitors: [
      { id: "sw_mr1", name: "Warkop PTB Maros", type: "LOCAL", distance: 200, angle: 100, rating: 4.3 },
      { id: "sw_mr2", name: "Kedai Kopi Bantimurung", type: "LOCAL", distance: 450, angle: 330, rating: 4.2 }
    ]
  },
  // SULAWESI SELATAN - PAREPARE, PALOPO, BONE
  {
    province: "Sulawesi Selatan",
    regency: "Kota Parepare",
    name: "Cappa Galung Coastal Promenade, Parepare",
    rent: 9000000,
    nationalCount: 0,
    localCount: 3,
    sentiment: "POSITIF",
    presetMatching: "Tamalanrea, Makassar",
    description: "Kawasan nongkrong ikonik di tepi pantai Kota Parepare. Sangat disayangi kawula muda lokal untuk menikmati sunset. Nol kompetitor waralaba kopi susu modern.",
    competitors: [
      { id: "sw_pr1", name: "Kopi Pantai Pare", type: "LOCAL", distance: 400, angle: 110, rating: 4.4 }
    ]
  },
  {
    province: "Sulawesi Selatan",
    regency: "Kota Palopo",
    name: "Jl. Andi Djemma (Pusat Kota), Palopo",
    rent: 8200000,
    nationalCount: 0,
    localCount: 2,
    sentiment: "POSITIF",
    presetMatching: "Tamalanrea, Makassar",
    description: "Pusat aktivitas ekonomi, sekolah besar, dan perkantoran tersibuk di Palopo. Ruko sewa murah dengan demografi pelajar mapan.",
    competitors: [
      { id: "sw_pl1", name: "Warkop Palopo Baru", type: "LOCAL", distance: 300, angle: 280, rating: 4.2 }
    ]
  },
  {
    province: "Sulawesi Selatan",
    regency: "Kabupaten Bone",
    name: "Jl. Besse Kajuara Watampone, Bone",
    rent: 7500000,
    nationalCount: 0,
    localCount: 2,
    sentiment: "POSITIF",
    presetMatching: "Tamalanrea, Makassar",
    description: "Sirkulasi keramaian utama di pusat Watampone, Bone. Target empuk untuk penetrasi brand lokal franchise dengan harga Rp 15 Ribuan.",
    competitors: [
      { id: "sw_bn1", name: "Warkop Bone Raya", type: "LOCAL", distance: 500, angle: 130, rating: 4.1 }
    ]
  },
  {
    province: "Sulawesi Selatan",
    regency: "Kabupaten Bulukumba",
    name: "Jalur Lintas Wisata (Depan Toko Cahaya), Bulukumba",
    rent: 6800000,
    nationalCount: 0,
    localCount: 2,
    sentiment: "POSITIF",
    presetMatching: "Tamalanrea, Makassar",
    description: "Hub perlintasan wisata ke Pantai Tanjung Bira. Jalur strategis untuk melayani wisatawan komuter yang membutuhkan asupan kafein cepat.",
    competitors: [
      { id: "sw_bl_1", name: "Warkop Phinisi Bulukumba", type: "LOCAL", distance: 400, angle: 90, rating: 4.3 }
    ]
  },
  {
    province: "Sulawesi Selatan",
    regency: "Kabupaten Toraja Utara",
    name: "Pusat Keramaian Rantepao (Samping Lapangan Bakti), Toraja Utara",
    rent: 7500000,
    nationalCount: 0,
    localCount: 3,
    sentiment: "POSITIF",
    presetMatching: "Tamalanrea, Makassar",
    description: "Jantung pariwisata Toraja yang dipenuhi turis lokal & mancanegara. Kebutuhan kopi susu premium berbanding lurus dengan budaya kopi lokal yang kental.",
    competitors: [
      { id: "sw_tu_1", name: "Tongkonan Coffee", type: "LOCAL", distance: 350, angle: 240, rating: 4.6 },
      { id: "sw_tu_2", name: "Kopi Rantepao Classic", type: "LOCAL", distance: 600, angle: 180, rating: 4.3 }
    ]
  },

  // SULAWESI UTARA
  {
    province: "Sulawesi Utara",
    regency: "Kota Manado",
    name: "Boulevard Area (Kawasan Megamas), Manado",
    rent: 18000000,
    nationalCount: 2,
    localCount: 4,
    sentiment: "POSITIF",
    presetMatching: "Tamalanrea, Makassar",
    description: "Episentrum gaya hidup & kuliner pesisir Pantai Manado. Sangat ramai perkumpulan anak muda kawanua berdaya beli tinggi di sore hingga malam hari.",
    competitors: [
      { id: "sw_mn1", name: "Starbucks Megamas", type: "NATIONAL", distance: 600, angle: 80, rating: 4.6 },
      { id: "sw_mn2", name: "Kopi Kenangan Boulevard", type: "NATIONAL", distance: 1100, angle: 160, rating: 4.4 },
      { id: "sw_mn3", name: "Kopi Es Tak Kie Manado", type: "LOCAL", distance: 400, angle: 300, rating: 4.3 }
    ]
  },
  {
    province: "Sulawesi Utara",
    regency: "Kota Tomohon",
    name: "Koridor Kampus & Wisata Walian, Tomohon",
    rent: 9500000,
    nationalCount: 0,
    localCount: 2,
    sentiment: "POSITIF",
    presetMatching: "Tamalanrea, Makassar",
    description: "Kota sejuk Tomohon dengan mobilitas pelajar sekolah tinggi & universitas swasta terkemuka. Sensitif terhadap nuansa dine-in estetik berharga terjangkau.",
    competitors: [
      { id: "sw_tm1", name: "Kopi Lokon Tomohon", type: "LOCAL", distance: 300, angle: 45, rating: 4.5 }
    ]
  },

  // SULAWESI TENGAH
  {
    province: "Sulawesi Tengah",
    regency: "Kota Palu",
    name: "Anjungan Teluk Palu (Bypass Lere), Palu",
    rent: 11000000,
    nationalCount: 1,
    localCount: 3,
    sentiment: "POSITIF",
    presetMatching: "Tamalanrea, Makassar",
    description: "Kawasan pulih pesisir pantai pasca-tsunami yang kini menjadi pusat rekreasi andalan keluarga Palu. Udara pantai yang sangat hidup di malam hari.",
    competitors: [
      { id: "sw_pl_c1", name: "Point Coffee Palu", type: "NATIONAL", distance: 1200, angle: 120, rating: 4.3 },
      { id: "sw_pl_c2", name: "Warkop Tadulako", type: "LOCAL", distance: 450, angle: 290, rating: 4.4 }
    ]
  },
  {
    province: "Sulawesi Tengah",
    regency: "Kabupaten Morowali",
    name: "Pusat Urban Bahodopi (Kawasan Industri Nikel IMIP), Morowali",
    rent: 15000000,
    nationalCount: 0,
    localCount: 4,
    sentiment: "POSITIF",
    presetMatching: "Tamalanrea, Makassar",
    description: "Kawasan super-padat pekerja industri tambang logam nikel tersibuk di Asia Tenggara. Arus perputaran uang (liquidity) sangat masif, nol brand kopi modern.",
    competitors: [
      { id: "sw_mr_c1", name: "Kedai Kopi Trans Bahodopi", type: "LOCAL", distance: 350, angle: 110, rating: 4.1 },
      { id: "sw_mr_c2", name: "Warkop Pekerja Morowali", type: "LOCAL", distance: 600, angle: 250, rating: 4.2 }
    ]
  },

  // SULAWESI TENGGARA
  {
    province: "Sulawesi Tenggara",
    regency: "Kota Kendari",
    name: "Hub Komersial Bypass Anduonohu, Kendari",
    rent: 13000000,
    nationalCount: 1,
    localCount: 3,
    sentiment: "POSITIF",
    presetMatching: "Tamalanrea, Makassar",
    description: "Ruas jalan terpadat di Kendari dekat kompleks perkantoran pemerintahan provinsi & kampus Universitas Haluoleo. Mobilitas komuter takeout sangat tinggi.",
    competitors: [
      { id: "sw_kd1", name: "Kopi Kenangan Kendari", type: "NATIONAL", distance: 950, angle: 90, rating: 4.3 },
      { id: "sw_kd2", name: "Warkop Kendari Beach", type: "LOCAL", distance: 400, angle: 320, rating: 4.4 }
    ]
  },
  {
    province: "Sulawesi Tenggara",
    regency: "Kota Baubau",
    name: "Kotamara Waterfront Promenade, Baubau",
    rent: 8000000,
    nationalCount: 0,
    localCount: 2,
    sentiment: "POSITIF",
    presetMatching: "Tamalanrea, Makassar",
    description: "Ruang publik terbuka rekreasi warga Baubau di tepi pelabuhan laut Buton yang ramai kapal singgah. Tingkat keramaian sore hari sangat tinggi.",
    competitors: [
      { id: "sw_bb1", name: "Buton Espresso", type: "LOCAL", distance: 450, angle: 210, rating: 4.5 }
    ]
  },

  // SULAWESI BARAT
  {
    province: "Sulawesi Barat",
    regency: "Kabupaten Mamuju",
    name: "Anjungan Pantai Manakarra, Mamuju",
    rent: 8500000,
    nationalCount: 0,
    localCount: 2,
    sentiment: "POSITIF",
    presetMatching: "Tamalanrea, Makassar",
    description: "Ikon terpenting ibukota Sulawesi Barat di tepi selat Makassar. Menjadi episentrum rekreasi, jalan santai, dan olahraga warga lokal.",
    competitors: [
      { id: "sw_mj1", name: "Kopi Manakarra", type: "LOCAL", distance: 300, angle: 130, rating: 4.4 },
      { id: "sw_mj2", name: "Warkop Sulbar Raya", type: "LOCAL", distance: 700, angle: 30, rating: 4.1 }
    ]
  },

  // GORONTALO
  {
    province: "Gorontalo",
    regency: "Kota Gorontalo",
    name: "Koridor Kampus UNG (Jl. Sudirman), Gorontalo",
    rent: 9500000,
    nationalCount: 1,
    localCount: 3,
    sentiment: "POSITIF",
    presetMatching: "Tamalanrea, Makassar",
    description: "Area paling hidup dilingkari belasan ribu civitas akademika Universitas Negeri Gorontalo. Tingkat loyalitas nongkrong durasi panjang yang tinggi.",
    competitors: [
      { id: "sw_gt1", name: "Kopi Kenangan UNG", type: "NATIONAL", distance: 800, angle: 120, rating: 4.4 },
      { id: "sw_gt2", name: "Warkop Serambi Gorontalo", type: "LOCAL", distance: 350, angle: 310, rating: 4.3 }
    ]
  },

  // JAWA BARAT - KOTA BANDUNG
  {
    province: "Jawa Barat",
    regency: "Kota Bandung",
    name: "Geger Kalong Hilir (Area UPI), Bandung",
    rent: 9800000,
    nationalCount: 1,
    localCount: 2,
    sentiment: "POSITIF",
    presetMatching: "Dago, Bandung",
    description: "Sangat padat kos-kosan mahasiswa UPI & ENHAII Bandung. Biaya sewa lapak sangat rendah (dibawah Rp 10 Juta/bln). Sangat minim kompetitor nasional besar.",
    competitors: [
      { id: "sw6", name: "Kopi Kenangan Setiabudi", type: "NATIONAL", distance: 1400, angle: 60, rating: 4.2 },
      { id: "sw7", name: "Kopi Sebelah UPI", type: "LOCAL", distance: 300, angle: 110, rating: 4.4 },
      { id: "sw8", name: "Warung Kopi Gerlong", type: "LOCAL", distance: 550, angle: 330, rating: 4.1 },
    ]
  },
  {
    province: "Jawa Barat",
    regency: "Kota Bandung",
    name: "Coblong (Area Dago Atas), Bandung",
    rent: 13500000,
    nationalCount: 0,
    localCount: 3,
    sentiment: "POSITIF",
    presetMatching: "Dago, Bandung",
    description: "Kawasan pemukiman sejuk turis akhir pekan. Hanya ditempati warkop lokal independen tanpa brand nasional dominan dalam radius pendaratan 1km.",
    competitors: [
      { id: "sw9", name: "Kopi Abah Coblong", type: "LOCAL", distance: 400, angle: 220, rating: 4.5 },
      { id: "sw10", name: "Dago View Corner", type: "LOCAL", distance: 850, angle: 45, rating: 4.3 },
    ]
  },
  // JAWA BARAT - KOTA BOGOR
  {
    province: "Jawa Barat",
    regency: "Kota Bogor",
    name: "Koridor Pandu Raya (Culinary Precinct), Bogor",
    rent: 15000000,
    nationalCount: 1,
    localCount: 3,
    sentiment: "POSITIF",
    presetMatching: "Dago, Bandung",
    description: "Hub berkumpulnya keluarga muda dan penikmat kuliner di Bogor Utara. Lebar jalan memadai untuk parkir singgah pickup taksi online.",
    competitors: [
      { id: "sw_bg1", name: "Kopi Kenangan Pandu", type: "NATIONAL", distance: 900, angle: 170, rating: 4.3 },
      { id: "sw_bg2", name: "Bogor Espresso Bar", type: "LOCAL", distance: 200, angle: 290, rating: 4.5 }
    ]
  },
  // JAWA BARAT - KOTA BEKASI
  {
    province: "Jawa Barat",
    regency: "Kota Bekasi",
    name: "Grand Galaxy Boulevard Selatan, Bekasi",
    rent: 16500000,
    nationalCount: 2,
    localCount: 4,
    sentiment: "POSITIF",
    presetMatching: "Dago, Bandung",
    description: "Pusat nongkrong generasi Z di pinggiran Jakarta Timur. Traksi penjualan takeout/delivery di malam minggu luar biasa tinggi.",
    competitors: [
      { id: "sw_bk1", name: "Kopi Kenangan Galaxy", type: "NATIONAL", distance: 500, angle: 40, rating: 4.4 },
      { id: "sw_bk2", name: "Warkop Galaxy Modern", type: "LOCAL", distance: 150, angle: 250, rating: 4.2 }
    ]
  },

  // DKI JAKARTA - JAKARTA PUSAT
  {
    province: "DKI Jakarta",
    regency: "Kota Jakarta Pusat",
    name: "Cempaka Putih Tengah, Jakarta Pusat",
    rent: 19500000,
    nationalCount: 1,
    localCount: 3,
    sentiment: "POSITIF",
    presetMatching: "Menteng, Jakarta Pusat",
    description: "Kawasan hunian keluarga mapan dengan densitas perkantoran sedang. Bebas banjir dengan harga sewa kompetitif di bawah batas Rp 20 Juta.",
    competitors: [
      { id: "sw11", name: "Fore Coffee Cempaka", type: "NATIONAL", distance: 1300, angle: 80, rating: 4.4 },
      { id: "sw12", name: "Kopi Teman Cempaka", type: "LOCAL", distance: 400, angle: 140, rating: 4.3 },
      { id: "sw13", name: "Kedai Kopi Cempaka", type: "LOCAL", distance: 900, angle: 290, rating: 4.2 },
    ]
  },
  {
    province: "DKI Jakarta",
    regency: "Kota Jakarta Pusat",
    name: "Gambir Baru (Samping Stasiun), Jakarta Pusat",
    rent: 18000000,
    nationalCount: 1,
    localCount: 2,
    sentiment: "NETRAL",
    presetMatching: "Menteng, Jakarta Pusat",
    description: "Sirkulasi komuter kereta sangat tinggi. Keunggulan layanan Self-Pickup dengan pager sirkulasi akan sangat prima menarik penumpang tergesa-gesa.",
    competitors: [
      { id: "sw14", name: "Starbucks Gambir", type: "NATIONAL", distance: 300, angle: 45, rating: 4.5 },
      { id: "sw15", name: "Rotio & Kopi Stasiun", type: "LOCAL", distance: 200, angle: 180, rating: 4.1 },
    ]
  },
  // DKI JAKARTA - JAKARTA SELATAN
  {
    province: "DKI Jakarta",
    regency: "Kota Jakarta Selatan",
    name: "Samping Stasiun MRT Cipete, Jakarta Selatan",
    rent: 24000000,
    nationalCount: 3,
    localCount: 5,
    sentiment: "NETRAL",
    presetMatching: "Menteng, Jakarta Pusat",
    description: "Magnet kuliner dan komuter papan atas Jakarta Selatan. Sangat padat pejalan kaki pagi hari yang menyukai transaksi instan cepat tanpa antrean kasir lama.",
    competitors: [
      { id: "sw_js1", name: "Starbucks Cipete", type: "NATIONAL", distance: 400, angle: 120, rating: 4.6 },
      { id: "sw_js2", name: "Kopi Toko Djawa Cipete", type: "LOCAL", distance: 150, angle: 30, rating: 4.5 }
    ]
  },
  // DKI JAKARTA - JAKARTA TIMUR
  {
    province: "DKI Jakarta",
    regency: "Kota Jakarta Timur",
    name: "Samping UNJ Rawamangun, Jakarta Timur",
    rent: 17500000,
    nationalCount: 1,
    localCount: 3,
    sentiment: "POSITIF",
    presetMatching: "Menteng, Jakarta Pusat",
    description: "Lingkungan padat mahasiswa universitas negeri dan sekolah menengah favorit. Sensitivitas harga tinggi dengan kecintaan kumpul kelompok yang awet.",
    competitors: [
      { id: "sw_jt1", name: "Kopi Kenangan Rawamangun", type: "NATIONAL", distance: 600, angle: 210, rating: 4.3 },
      { id: "sw_jt2", name: "Kedai Kopi Pelajar", type: "LOCAL", distance: 200, angle: 310, rating: 4.4 }
    ]
  },

  // BALI - BADUNG / KUTA
  {
    province: "Bali",
    regency: "Kabupaten Badung (Kuta)",
    name: "Jimbaran Kidul (Dekat Unud Bali), Badung",
    rent: 16000000,
    nationalCount: 1,
    localCount: 2,
    sentiment: "POSITIF",
    presetMatching: "Kuta, Bali",
    description: "Wilayah kos-kosan mahasiswa Universitas Udayana. Harga sewa tanah komersial jauh lebih terjangkau dibandingkan pantai Seminyak yang overprice harian.",
    competitors: [
      { id: "sw16", name: "Kopi Kenangan Jimbaran", type: "NATIONAL", distance: 950, angle: 70, rating: 4.3 },
      { id: "sw17", name: "Wayan Espresso Jimbaran", type: "LOCAL", distance: 400, angle: 320, rating: 4.6 },
    ]
  },
  {
    province: "Bali",
    regency: "Kabupaten Badung (Kuta)",
    name: "Canggu Utara (Samping Sawah), Badung",
    rent: 22000000,
    nationalCount: 1,
    localCount: 4,
    sentiment: "POSITIF",
    presetMatching: "Kuta, Bali",
    description: "Kawasan eksekutif expatriat & Digital Nomad. Banyak pendatang asing yang menyenangi brand kopi susu lokal autentik dengan sistem pengambilan cepat.",
    competitors: [
      { id: "sw18", name: "Nook Espresso", type: "LOCAL", distance: 600, angle: 120, rating: 4.7 },
      { id: "sw19", name: "Kopi Canggu Hub", type: "LOCAL", distance: 300, angle: 280, rating: 4.4 },
    ]
  },
  // BALI - KOTA DENPASAR
  {
    province: "Bali",
    regency: "Kota Denpasar",
    name: "Samping Lapangan Niti Mandala Renon, Denpasar",
    rent: 18000000,
    nationalCount: 2,
    localCount: 3,
    sentiment: "POSITIF",
    presetMatching: "Kuta, Bali",
    description: "Episentrum olahraga pagi-sore dan klaster perkantoran paling penting di Bali. Konsumsi kopi harian andalan para pegawai negeri & swasta.",
    competitors: [
      { id: "sw_dp1", name: "Kopi Kenangan Renon", type: "NATIONAL", distance: 800, angle: 80, rating: 4.3 },
      { id: "sw_dp2", name: "Warkop Renon Sanur", type: "LOCAL", distance: 400, angle: 260, rating: 4.4 }
    ]
  },
  // BALI - GIANYAR / UBUD
  {
    province: "Bali",
    regency: "Kabupaten Gianyar (Ubud)",
    name: "Monkey Forest Outer Rim (Ubud), Gianyar",
    rent: 26000000,
    nationalCount: 1,
    localCount: 4,
    sentiment: "NETRAL",
    presetMatching: "Kuta, Bali",
    description: "Kawasan premium turis seni mancanegara di Ubud. Kecepatan self-pickup menarik para pelancong pejalan kaki yang menginginkan layanan instan.",
    competitors: [
      { id: "sw_gy1", name: "Starbucks Ubud", type: "NATIONAL", distance: 500, angle: 110, rating: 4.6 }
    ]
  },

  // JAWA TIMUR - KOTA SURABAYA
  {
    province: "Jawa Timur",
    regency: "Kota Surabaya",
    name: "Rungkut Kidul (Industri SIER), Surabaya",
    rent: 11000000,
    nationalCount: 0,
    localCount: 3,
    sentiment: "NETRAL",
    presetMatching: "Gubeng, Surabaya",
    description: "Didominasi karyawan pabrik & kantor menengah. Belum ada kafe modern ber-AC dengan harga ramah kantong Rp 18.000an.",
    competitors: [
      { id: "sw20", name: "Warkop Rungkut Jaya", type: "LOCAL", distance: 300, angle: 150, rating: 4.3 },
      { id: "sw21", name: "Kedai Kopi SIER", type: "LOCAL", distance: 800, angle: 270, rating: 4.1 },
    ]
  },
  {
    province: "Jawa Timur",
    regency: "Kota Surabaya",
    name: "Mulyorejo (Dekat Kampus C Unair), Surabaya",
    rent: 13500000,
    nationalCount: 1,
    localCount: 3,
    sentiment: "POSITIF",
    presetMatching: "Gubeng, Surabaya",
    description: "Sangat potensial melayani mahasiswa Universitas Airlangga. Kompetisi sangat bersahabat dengan sewa ruko aman terkontrol harian.",
    competitors: [
      { id: "sw22", name: "Kopi Kenangan Dharmahusada", type: "NATIONAL", distance: 1100, angle: 90, rating: 4.3 },
      { id: "sw23", name: "Coba Kopi Unair", type: "LOCAL", distance: 350, angle: 210, rating: 4.4 },
      { id: "sw24", name: "Warkop Suroboyo Rek", type: "LOCAL", distance: 680, angle: 340, rating: 4.2 },
    ]
  },
  // JAWA TIMUR - KOTA MALANG
  {
    province: "Jawa Timur",
    regency: "Kota Malang",
    name: "Tlogomas (Samping Gerbang UMM), Malang",
    rent: 11500000,
    nationalCount: 1,
    localCount: 3,
    sentiment: "POSITIF",
    presetMatching: "Gubeng, Surabaya",
    description: "Lokasi strategis dikelilingi ribuan mahasiswa rantau Universitas Muhammadiyah Malang. Margin operasional sangat tinggi berkat sewa murah.",
    competitors: [
      { id: "sw_ml1", name: "Kopi Kenangan Tlogomas", type: "NATIONAL", distance: 700, angle: 240, rating: 4.3 },
      { id: "sw_ml2", name: "Warkop Arema Lowokwaru", type: "LOCAL", distance: 300, angle: 100, rating: 4.2 }
    ]
  },
  // JAWA TIMUR - KABUPATEN SIDOARJO
  {
    province: "Jawa Timur",
    regency: "Kabupaten Sidoarjo",
    name: "Jalur Hijau GOR Sidoarjo (Ponti), Sidoarjo",
    rent: 12500000,
    nationalCount: 1,
    localCount: 4,
    sentiment: "POSITIF",
    presetMatching: "Gubeng, Surabaya",
    description: "Jalan utama terpadat kuliner daerah Sidoarjo. Sangat ramai perkumpulan komunitas motor, skateboard, dan lari pagi/sore.",
    competitors: [
      { id: "sw_sd1", name: "Point Coffee Ponti", type: "NATIONAL", distance: 500, angle: 130, rating: 4.4 },
      { id: "sw_sd2", name: "Warkop Delta GOR", type: "LOCAL", distance: 250, angle: 340, rating: 4.2 }
    ]
  },

  // BANTEN - KABUPATEN TANGERANG
  {
    province: "Banten",
    regency: "Kabupaten Tangerang",
    name: "Cipondoh Indah, Tangerang",
    rent: 9500000,
    nationalCount: 0,
    localCount: 2,
    sentiment: "POSITIF",
    presetMatching: "Margonda, Depok",
    description: "Pemukiman suburban padat komuter Jakarta. Kurang dari 1 gerai kopi franchise besar dalam radius 2km, ruko sewa sangat melimpah & ramah kantong.",
    competitors: [
      { id: "sw25", name: "Kopi Rakyat Cipondoh", type: "LOCAL", distance: 250, angle: 300, rating: 4.4 },
      { id: "sw26", name: "Warkop Pojok Tangerang", type: "LOCAL", distance: 800, angle: 45, rating: 4.1 },
    ]
  },
  {
    province: "Banten",
    regency: "Kabupaten Tangerang",
    name: "Karawaci Baru (Dekat UPH), Tangerang",
    rent: 14500000,
    nationalCount: 1,
    localCount: 3,
    sentiment: "POSITIF",
    presetMatching: "Margonda, Depok",
    description: "Kepadatan mahasiswa UPH & pekerja Lippo Karawaci yang tinggi. Membutuhkan titik alternatif kopi susu murah terjangkau.",
    competitors: [
      { id: "sw27", name: "Starbucks Lippo Mall", type: "NATIONAL", distance: 1300, angle: 120, rating: 4.5 },
      { id: "sw28", name: "Kopi Campus Karawaci", type: "LOCAL", distance: 450, angle: 210, rating: 4.3 },
      { id: "sw29", name: "Warkop Millenial Karawaci", type: "LOCAL", distance: 750, angle: 350, rating: 4.2 },
    ]
  },
  // BANTEN - KOTA TANGERANG
  {
    province: "Banten",
    regency: "Kota Tangerang",
    name: "Pasar Lama Jalan Kisamaun, Tangerang",
    rent: 15500000,
    nationalCount: 1,
    localCount: 5,
    sentiment: "POSITIF",
    presetMatching: "Margonda, Depok",
    description: "Pusat jajan malam paling legendaris Tangerang. Daya beli makanan ringan sangat fantastis, minim outlet kopi susu drive-by berfitur pager.",
    competitors: [
      { id: "sw_tg1", name: "Kopi Es Tak Kie Pasar Lama", type: "LOCAL", distance: 300, angle: 140, rating: 4.5 }
    ]
  },
  // BANTEN - KOTA TANGERANG SELATAN
  {
    province: "Banten",
    regency: "Kota Tangerang Selatan",
    name: "Sektor 9 Bintaro (Dekat Pondok Ranji), Tangsel",
    rent: 19000000,
    nationalCount: 2,
    localCount: 4,
    sentiment: "POSITIF",
    presetMatching: "Margonda, Depok",
    description: "Akses penghubung komuter eksekutif muda Bintaro ke arah stasiun. Kecepatan pengambilan barang adalah nilai jual utama yang dicari konsumen.",
    competitors: [
      { id: "sw_ts1", name: "Starbucks Sektor 9", type: "NATIONAL", distance: 800, angle: 60, rating: 4.5 },
      { id: "sw_ts2", name: "Kopi Manyar Bintaro", type: "LOCAL", distance: 300, angle: 220, rating: 4.6 }
    ]
  }
];

const PROVINCES = [
  "Semua Provinsi",
  "Sulawesi Selatan",
  "Sulawesi Utara",
  "Sulawesi Tengah",
  "Sulawesi Tenggara",
  "Sulawesi Barat",
  "Gorontalo",
  "Jawa Barat",
  "DKI Jakarta",
  "Bali",
  "Jawa Timur",
  "Banten"
];

const REGENCY_MAP: Record<string, string[]> = {
  "Semua Provinsi": ["Semua Kota/Kabupaten"],
  "Sulawesi Selatan": [
    "Semua Kota/Kabupaten", 
    "Kota Makassar", 
    "Kabupaten Gowa", 
    "Kabupaten Maros", 
    "Kota Parepare",
    "Kota Palopo",
    "Kabupaten Bone",
    "Kabupaten Bulukumba",
    "Kabupaten Toraja Utara",
    "Kabupaten Tana Toraja",
    "Kabupaten Sidrap",
    "Kabupaten Pinrang",
    "Kabupaten Wajo",
    "Kabupaten Sinjai",
    "Kabupaten Bantaeng",
    "Kabupaten Takalar",
    "Kabupaten Pangkep",
    "Kabupaten Barru",
    "Kabupaten Luwu"
  ],
  "Sulawesi Utara": [
    "Semua Kota/Kabupaten",
    "Kota Manado",
    "Kota Tomohon",
    "Kota Bitung",
    "Kota Kotamobagu",
    "Kabupaten Minahasa",
    "Kabupaten Minahasa Utara",
    "Kabupaten Kepulauan Sangihe"
  ],
  "Sulawesi Tengah": [
    "Semua Kota/Kabupaten",
    "Kota Palu",
    "Kabupaten Sigi",
    "Kabupaten Donggala",
    "Kabupaten Poso",
    "Kabupaten Banggai (Luwuk)",
    "Kabupaten Morowali",
    "Kabupaten Tolitoli"
  ],
  "Sulawesi Tenggara": [
    "Semua Kota/Kabupaten",
    "Kota Kendari",
    "Kota Baubau",
    "Kabupaten Kolaka",
    "Kabupaten Konawe",
    "Kabupaten Wakatobi",
    "Kabupaten Muna"
  ],
  "Sulawesi Barat": [
    "Semua Kota/Kabupaten",
    "Kabupaten Mamuju",
    "Kabupaten Polewali Mandar",
    "Kabupaten Majene",
    "Kabupaten Mamasa",
    "Kabupaten Pasangkayu"
  ],
  "Gorontalo": [
    "Semua Kota/Kabupaten",
    "Kota Gorontalo",
    "Kabupaten Gorontalo (Limboto)",
    "Kabupaten Bone Bolango",
    "Kabupaten Boalemo",
    "Kabupaten Pohuwato"
  ],
  "Jawa Barat": [
    "Semua Kota/Kabupaten", 
    "Kota Bandung", 
    "Kota Bogor", 
    "Kota Bekasi", 
    "Kabupaten Bandung Barat"
  ],
  "DKI Jakarta": [
    "Semua Kota/Kabupaten", 
    "Kota Jakarta Pusat", 
    "Kota Jakarta Selatan", 
    "Kota Jakarta Timur"
  ],
  "Bali": [
    "Semua Kota/Kabupaten", 
    "Kabupaten Badung (Kuta)", 
    "Kota Denpasar", 
    "Kabupaten Gianyar (Ubud)"
  ],
  "Jawa Timur": [
    "Semua Kota/Kabupaten", 
    "Kota Surabaya", 
    "Kota Malang", 
    "Kabupaten Sidoarjo"
  ],
  "Banten": [
    "Semua Kota/Kabupaten", 
    "Kabupaten Tangerang", 
    "Kota Tangerang", 
    "Kota Tangerang Selatan"
  ]
};

export const CoraqLocationIntelligence: React.FC = () => {
  const { products } = useStore();

  const [locationName, setLocationName] = useState("Tamalanrea, Makassar");
  const [monthlyRent, setMonthlyRent] = useState(14000000);
  const [radius, setRadius] = useState(1500); // meters
  const [competitors, setCompetitors] = useState<Competitor[]>(PRESET_LOCATIONS[0].baseCompetitors);

  // Geographic coordinates for the Leaflet Map
  const [centerLat, setCenterLat] = useState(-5.1348);
  const [centerLng, setCenterLng] = useState(119.4894);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Province-Kabupaten Preset Filters state
  const [selectedProvince, setSelectedProvince] = useState<string>("Semua Provinsi");
  const [selectedRegency, setSelectedRegency] = useState<string>("Semua Kota/Kabupaten");
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Map View Settings state
  const [mapTheme, setMapTheme] = useState<"DARK" | "CLASSIC_LIGHT">("DARK");
  const [hoveredCompId, setHoveredCompId] = useState<string | null>(null);
  
  // Interactive Pan / Zoom logic inside Map Canvas Container
  const [zoom, setZoom] = useState<number>(0.9);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 50, y: -20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Proposed pin coordinates to support geographic placement
  const [pinX, setPinX] = useState(500);
  const [pinY, setPinY] = useState(500);
  const clickStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Deterministic GPS coordinate calculator to make the pin glide beautifully across distinct locations
  const getCoordinatesForSpotName = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Spread coordinates naturally in [350, 650] range so they align nicely near main roads & rivers
    const x = 380 + (Math.abs(hash) % 240);
    const y = 380 + (Math.abs(hash >> 8) % 240);
    return { x, y };
  };

  // Custom Input States for manual competitors add-on
  const [newCompName, setNewCompName] = useState("");
  const [newCompType, setNewCompType] = useState<"NATIONAL" | "LOCAL">("LOCAL");
  const [newCompDistance, setNewCompDistance] = useState(600);

  // Analysis result states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [isApiFallback, setIsApiFallback] = useState(false);

  // Compute metrics in real-time
  const metrics = useMemo(() => {
    const activeComps = competitors.filter(c => c.distance <= radius);
    const nationalCount = activeComps.filter(c => c.type === "NATIONAL").length;
    const localCount = activeComps.filter(c => c.type === "LOCAL").length;
    return {
      nationalCount,
      localCount,
      totalCount: activeComps.length
    };
  }, [competitors, radius]);

  // Retrieve current active preset properties for SVG outline mapping
  const activePreset = useMemo<PresetLocation>(() => {
    const exactMatch = PRESET_LOCATIONS.find(loc => loc.name === locationName);
    if (exactMatch) return exactMatch;
    
    const nameLower = locationName.toLowerCase();
    
    // Check which region matching to generate high-fidelity dynamic visual simulated maps
    let matchedRegion = "";
    let landmarksList: typeof PRESET_LOCATIONS[0]["landmarks"] = [];
    let riverPath = "M-100,100 C-80,180 -50,300 -120,400 C-170,470 -220,500 -180,620 L-90,1000";
    let mainRoadPath = "M-200,900 L1200,50";
    let secondaryRoads = [
      "M200,100 L200,900",
      "M450,150 Q550,500 800,850",
      "M-50,600 L600,550",
    ];
    let lakeCircle = { cx: 220, cy: 720, r: 60 };
    let sentiment: "POSITIF" | "NETRAL" | "NEGATIF" = "POSITIF";

    if (nameLower.includes("manado") || nameLower.includes("tomohon") || nameLower.includes("sulawesi utara")) {
      matchedRegion = nameLower.includes("tomohon") ? "Tomohon, Sulawesi Utara" : "Manado, Sulawesi Utara";
      riverPath = "M-200,300 C150,400 300,300 450,550 C600,800 700,1100 800,1300"; // Waterfront
      mainRoadPath = "M100,-100 L350,1100"; // Jl. Boulevard Piere Tendean
      secondaryRoads = [
        "M350,300 L950,550", // Jl. Sam Ratulangi
        "M100,600 L800,600",
      ];
      lakeCircle = { cx: 120, cy: 820, r: 50 };
      landmarksList = nameLower.includes("tomohon") ? [
        { name: "Pasar Ekstrem Tomohon", x: 500, y: 250, type: "commercial" },
        { name: "Gunung Lokon Viewpoint", x: 150, y: 380, type: "nature" },
        { name: "Koridor Kampus Walian", x: 600, y: 780, type: "education" },
        { name: "Tomohon Flower Market", x: 420, y: 440, type: "commercial" }
      ] : [
        { name: "Kawasan Megamas Boulevard", x: 180, y: 320, type: "commercial" },
        { name: "Manado Town Square (Mantos)", x: 420, y: 550, type: "commercial" },
        { name: "Jembatan Soekarno Manado", x: 80, y: 480, type: "nature" },
        { name: "Kampus Unsrat (Wanea)", x: 750, y: 800, type: "education" },
        { name: "Malalayang Beach Coast", x: -90, y: 220, type: "nature" },
      ];
    } else if (nameLower.includes("palu") || nameLower.includes("morowali") || nameLower.includes("poso") || nameLower.includes("central sulawesi") || nameLower.includes("sulawesi tengah")) {
      matchedRegion = nameLower.includes("morowali") ? "Bahodopi, Morowali" : "Teluk Palu, Sulawesi Tengah";
      riverPath = "M500,-200 L420,150 L560,400 L380,680 L500,1100"; // Coastal
      mainRoadPath = "M100,-100 L800,1000"; // Jl. Trans Sulawesi
      secondaryRoads = [
        "M0,350 L1000,350",
        "M600,100 L200,900"
      ];
      lakeCircle = { cx: 480, cy: 520, r: 35 };
      landmarksList = nameLower.includes("morowali") ? [
        { name: "Kawasan Industri IMIP Bahodopi", x: 320, y: 320, type: "commercial" },
        { name: "Pintu Gerbang IMIP", x: 580, y: 360, type: "general" },
        { name: "Pelabuhan Jetty Morowali", x: 220, y: 150, type: "commercial" },
        { name: "Pemukiman Pekerja Trans", x: 750, y: 800, type: "general" }
      ] : [
        { name: "Anjungan Teluk Palu (Bypass Lere)", x: 320, y: 320, type: "nature" },
        { name: "Masjid Terapung Palu (Lere)", x: 580, y: 360, type: "nature" },
        { name: "Palu Grand Mall Area", x: 220, y: 150, type: "commercial" },
        { name: "Kampus Universitas Tadulako", x: 750, y: 800, type: "education" }
      ];
    } else if (nameLower.includes("kendari") || nameLower.includes("baubau") || nameLower.includes("kolaka") || nameLower.includes("sulawesi tenggara")) {
      matchedRegion = nameLower.includes("baubau") ? "Kotamara, Baubau" : "Bypass Anduonohu, Kendari";
      riverPath = "M-150,300 C50,400 300,300 450,550 C600,800 500,1100 400,1300"; // Waterfront
      mainRoadPath = "M100,-100 L350,1100"; // Bypass
      secondaryRoads = [
        "M350,300 L950,550", // MT Haryono
        "M100,600 L800,600"
      ];
      lakeCircle = { cx: 120, cy: 820, r: 50 };
      landmarksList = nameLower.includes("baubau") ? [
        { name: "Kotamara Waterfront Promenade", x: 180, y: 320, type: "nature" },
        { name: "Benteng Keraton Buton", x: 420, y: 550, type: "nature" },
        { name: "Pelabuhan Murhum Baubau", x: 80, y: 480, type: "commercial" }
      ] : [
        { name: "Bypass Kendari Beach Center", x: 180, y: 320, type: "nature" },
        { name: "Kampus Universitas Halu Oleo", x: 420, y: 550, type: "education" },
        { name: "Lippo Plaza Kendari", x: 80, y: 480, type: "commercial" },
        { name: "Masjid Al-Alam (Tengah Laut)", x: 750, y: 800, type: "nature" }
      ];
    } else if (nameLower.includes("mamuju") || nameLower.includes("majene") || nameLower.includes("polewali") || nameLower.includes("sulawesi barat")) {
      matchedRegion = "Pantai Manakarra, Mamuju";
      riverPath = "M-200,150 C50,200 450,250 600,450 C750,600 800,1100 850,1300"; // Coast
      mainRoadPath = "M100,-100 L350,1100";
      secondaryRoads = [
        "M350,300 L950,550",
        "M100,600 L800,600"
      ];
      lakeCircle = { cx: 120, cy: 820, r: 50 };
      landmarksList = [
        { name: "Anjungan Pantai Manakarra", x: 180, y: 320, type: "nature" },
        { name: "Kantor Gubernur SULBAR", x: 420, y: 550, type: "general" },
        { name: "Maleo Town Square (Matos)", x: 80, y: 480, type: "commercial" }
      ];
    } else if (nameLower.includes("gorontalo") || nameLower.includes("limboto")) {
      matchedRegion = nameLower.includes("limboto") ? "Limboto, Gorontalo" : "Kota Gorontalo";
      riverPath = "M500,-200 L420,150 L560,400 L380,680 L500,1100";
      mainRoadPath = "M100,-100 L800,1000";
      secondaryRoads = [
        "M0,350 L1000,350",
        "M600,100 L200,900"
      ];
      lakeCircle = { cx: 480, cy: 520, r: 35 };
      landmarksList = nameLower.includes("limboto") ? [
        { name: "Menara Keagungan Limboto", x: 320, y: 320, type: "general" },
        { name: "Taman Budaya Limboto", x: 580, y: 360, type: "nature" },
        { name: "Danau Limboto Coast", x: 220, y: 150, type: "nature" }
      ] : [
        { name: "Kampus Universitas Negeri Gorontalo", x: 320, y: 320, type: "education" },
        { name: "Taman Kota Gorontalo", x: 580, y: 360, type: "nature" },
        { name: "Pusat Grosir Mall Gorontalo", x: 220, y: 150, type: "commercial" }
      ];
    } else if (nameLower.includes("bulukumba") || nameLower.includes("toraja") || nameLower.includes("bone") || nameLower.includes("sidrap") || nameLower.includes("parepare") || nameLower.includes("palopo") || nameLower.includes("maros") || nameLower.includes("gowa") || nameLower.includes("makassar") || nameLower.includes("sulawesi selatan")) {
      if (nameLower.includes("bulukumba")) {
        matchedRegion = "Ujung Bulu, Bulukumba";
        landmarksList = [
          { name: "Jalan Lintas Wisata Bira", x: 220, y: 640, type: "commercial" },
          { name: "Pantai Tanjung Bira Outlet", x: -90, y: 220, type: "nature" },
          { name: "Pelabuhan Phinisi Bulukumba", x: 420, y: 440, type: "nature" },
        ];
      } else if (nameLower.includes("toraja")) {
        matchedRegion = "Rantepao, Toraja Utara";
        landmarksList = [
          { name: "Lapangan Bakti Rantepao", x: 220, y: 640, type: "general" },
          { name: "Wisata Adat Ke'te Kesu'", x: -90, y: 220, type: "nature" },
          { name: "Sungai Sa'dan", x: 420, y: 440, type: "nature" },
          { name: "Pasar Hewan Bolu Rantepao", x: 670, y: 380, type: "commercial" },
        ];
      } else if (nameLower.includes("bone")) {
        matchedRegion = "Watampone, Bone";
        landmarksList = [
          { name: "Lapangan Merdeka Watampone", x: 220, y: 640, type: "general" },
          { name: "Samping Museum Lapawawoi", x: -90, y: 220, type: "education" },
          { name: "Toko Bintang Bone", x: 420, y: 440, type: "commercial" },
        ];
      } else if (nameLower.includes("parepare")) {
        matchedRegion = "Coastal Promenade, Parepare";
        landmarksList = [
          { name: "Pantai Cappa Galung", x: 220, y: 640, type: "nature" },
          { name: "Pelabuhan Nusantara Parepare", x: -90, y: 220, type: "commercial" },
          { name: "Monumen Cinta Sejati Habibie Ainun", x: 420, y: 440, type: "general" },
        ];
      } else if (nameLower.includes("palopo")) {
        matchedRegion = "Andi Djemma, Palopo";
        landmarksList = [
          { name: "Stadion Lapangan Lagaligo", x: 220, y: 640, type: "general" },
          { name: "Istana Kedatuan Luwu", x: -90, y: 220, type: "education" },
          { name: "Kampus Universitas Cokroaminoto", x: 420, y: 440, type: "education" },
        ];
      } else if (nameLower.includes("maros")) {
        matchedRegion = "Taman Kuliner PTB, Maros";
        landmarksList = [
          { name: "Taman Pantai Tak Berombak (PTB)", x: 220, y: 640, type: "nature" },
          { name: "Kawasan Hutan Pinus Karaeng", x: -90, y: 220, type: "nature" },
          { name: "Masjid Al-Markaz Maros", x: 420, y: 440, type: "general" },
        ];
      } else if (nameLower.includes("gowa")) {
        matchedRegion = "Tun Abdul Razak, Gowa";
        landmarksList = [
          { name: "Masjid Raya Syekh Yusuf", x: 220, y: 640, type: "general" },
          { name: "Teras Citraland Gowa", x: -90, y: 220, type: "commercial" },
          { name: "Hutan Kota Sungguminasa", x: 420, y: 440, type: "nature" },
        ];
      } else {
        matchedRegion = "Tamalanrea, Makassar";
        landmarksList = [
          { name: "Universitas Hasanuddin (Unhas)", x: 220, y: 640, type: "education" },
          { name: "Auditorium Prof. A. Amiruddin", x: 190, y: 550, type: "education" },
          { name: "Dermaga Kera-Kera / P. Lakkang", x: -90, y: 220, type: "nature" },
          { name: "Toko Bintang Tamalanrea", x: 420, y: 440, type: "commercial" },
          { name: "Masjid Jami Nurul Iman Telkomas", x: 670, y: 380, type: "general" },
        ];
      }
    }

    if (matchedRegion) {
      return {
        name: matchedRegion,
        defaultRent: monthlyRent,
        nationalCount: metrics.nationalCount,
        localCount: metrics.localCount,
        sentiment,
        baseCompetitors: competitors,
        riverPath,
        mainRoadPath,
        secondaryRoads,
        unhasLakeCircle: lakeCircle,
        landmarks: landmarksList,
      };
    }

    // Default fallbacks to PRESET_LOCATIONS
    if (nameLower.includes("bandung")) {
      return PRESET_LOCATIONS.find(loc => loc.name.toLowerCase().includes("bandung")) || PRESET_LOCATIONS[0];
    }
    if (nameLower.includes("jakarta")) {
      return PRESET_LOCATIONS.find(loc => loc.name.toLowerCase().includes("jakarta")) || PRESET_LOCATIONS[0];
    }
    if (nameLower.includes("bali") || nameLower.includes("badung")) {
      return PRESET_LOCATIONS.find(loc => loc.name.toLowerCase().includes("bali")) || PRESET_LOCATIONS[0];
    }
    if (nameLower.includes("surabaya")) {
      return PRESET_LOCATIONS.find(loc => loc.name.toLowerCase().includes("surabaya")) || PRESET_LOCATIONS[0];
    }
    if (nameLower.includes("depok") || nameLower.includes("tangerang")) {
      return PRESET_LOCATIONS.find(loc => loc.name.toLowerCase().includes("depok")) || PRESET_LOCATIONS[0];
    }
    return PRESET_LOCATIONS[0];
  }, [locationName, monthlyRent, metrics, competitors]);

  // Apply presets when selected
  const handleSelectPreset = (preset: PresetLocation) => {
    setLocationName(preset.name);
    setMonthlyRent(preset.defaultRent);
    setCompetitors(preset.baseCompetitors);
    setAnalysisResult(null);
    setZoom(0.9);
    setPan({ x: 50, y: -20 });
    // Reset to center pin position
    setPinX(500);
    setPinY(500);
    setCenterLat(preset.lat);
    setCenterLng(preset.lng);
  };

  // Filter address suggestions dynamically
  const activeSuggestions = useMemo(() => {
    if (!locationName || locationName.length < 2) return [];
    return ADDRESS_SUGGESTIONS.filter(item => 
      item.name.toLowerCase().includes(locationName.toLowerCase()) &&
      item.name.toLowerCase() !== locationName.toLowerCase()
    );
  }, [locationName]);

  // Filter sweet-spot locations
  const filteredSweetSpots = useMemo(() => {
    return SWEET_SPOTS.filter(spot => {
      const matchProv = selectedProvince === "Semua Provinsi" || spot.province === selectedProvince;
      const matchReg = selectedRegency === "Semua Kota/Kabupaten" || spot.regency === selectedRegency;
      return matchProv && matchReg;
    });
  }, [selectedProvince, selectedRegency]);

  // Apply Address Suggestion Selection
  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setLocationName(suggestion.name);
    setMonthlyRent(suggestion.rent);
    setShowSuggestions(false);
    
    const mapped = PRESET_LOCATIONS.find(p => p.name === suggestion.presetsMatching);
    if (mapped) {
      setCompetitors(mapped.baseCompetitors);
      setCenterLat(mapped.lat);
      setCenterLng(mapped.lng);
    }
    setAnalysisResult(null);
    
    // Set customized geographic pin coordinates based on address name hash
    const coords = getCoordinatesForSpotName(suggestion.name);
    setPinX(coords.x);
    setPinY(coords.y);
  };

  // Apply Sweet Spot Location selection
  const handleSelectSweetSpot = (spot: SweetSpot) => {
    setLocationName(spot.name);
    setMonthlyRent(spot.rent);
    setCompetitors(spot.competitors);
    setAnalysisResult(null);
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    
    // Set geographic coordinates based on preset matching
    const preset = PRESET_LOCATIONS.find(p => p.name === spot.presetMatching);
    if (preset) {
      setCenterLat(preset.lat);
      setCenterLng(preset.lng);
    }
    
    // Set customized geographic pin coordinates based on spot name hash
    const coords = getCoordinatesForSpotName(spot.name);
    setPinX(coords.x);
    setPinY(coords.y);
    
    // Auto-analyze
    setTimeout(() => {
      handleAnalyzeLocation();
    }, 150);
  };

  // Separation of Selling Item (BOM list) or general menu items
  const menuSummary = useMemo(() => {
    return products.map(p => ({
      name: p.name,
      price: p.price
    }));
  }, [products]);

  // Add Custom Competitor Manually
  const handleAddCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim()) return;

    const newComp: Competitor = {
      id: "manual_" + Date.now(),
      name: newCompName.trim(),
      type: newCompType,
      distance: Number(newCompDistance),
      angle: Math.floor(Math.random() * 360),
      rating: parseFloat((4.0 + Math.random() * 0.9).toFixed(1))
    };

    setCompetitors([...competitors, newComp]);
    setNewCompName("");
    setAnalysisResult(null); // Clear old analysis
  };

  const handleRemoveCompetitor = (id: string) => {
    setCompetitors(competitors.filter(c => c.id !== id));
    setAnalysisResult(null); // Clear old analysis
  };

  // Core API trigger for Coraq Location Intelligence (CLI) using Gemini
  const handleAnalyzeLocation = async () => {
    setLoading(true);
    setError(null);
    
    let currentLat = centerLat;
    let currentLng = centerLng;

    try {
      // 1. Parse coordinates from locationName if manually placed, or look up via Nominatim
      const geoMatch = locationName.match(/Geografis\s+([-\d.]+),\s+([-\d.]+)/);
      if (geoMatch) {
        currentLat = parseFloat(geoMatch[1]);
        currentLng = parseFloat(geoMatch[2]);
        setCenterLat(currentLat);
        setCenterLng(currentLng);
      } else {
        const exactPreset = PRESET_LOCATIONS.find(p => p.name === locationName);
        if (exactPreset) {
          currentLat = exactPreset.lat;
          currentLng = exactPreset.lng;
          setCenterLat(currentLat);
          setCenterLng(currentLng);
        } else {
          // Dynamic Nominatim lookup for custom search terms
          try {
            const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`, {
              headers: {
                "User-Agent": "CoraqCoffeePOS/1.0"
              }
            });
            const geoData = await geoResponse.json();
            if (geoData && geoData.length > 0) {
              currentLat = parseFloat(geoData[0].lat);
              currentLng = parseFloat(geoData[0].lon);
              setCenterLat(currentLat);
              setCenterLng(currentLng);
            }
          } catch (geoErr) {
            console.warn("OSM Nominatim Geocoding fallback:", geoErr);
          }
        }
      }

      const response = await fetch("/api/marketing/location-analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locationName,
          monthlyRent,
          searchRadius: radius,
          nationalCompetitorsCount: metrics.nationalCount,
          localCompetitorsCount: metrics.localCount,
          menuSummary
        })
      });

      if (!response.ok) {
        throw new Error("Gagal memperoleh respons analitis dari server.");
      }

      const data = await response.json();
      setAnalysisResult(data.forecast);
      setSources(data.sources || []);
      setIsApiFallback(!!data.isFallback);

      // Handle real competitor pins returned by Google Search Grounding dynamically
      if (data.forecast && data.forecast.realCompetitors && data.forecast.realCompetitors.length > 0) {
        const mappedReal: Competitor[] = data.forecast.realCompetitors.map((c: any, index: number) => {
          // Calculate beautifully distributed angles across 360 degrees of the radar mapping
          const angle = Math.floor((index * (360 / Math.max(1, data.forecast.realCompetitors.length))) + (Math.random() * 20));
          return {
            id: c.id || `real_${Date.now()}_${index}`,
            name: c.name,
            type: c.type || "LOCAL",
            distance: c.distance || Math.floor(100 + Math.random() * 800),
            angle: angle,
            rating: c.rating || parseFloat((4.1 + Math.random() * 0.8).toFixed(1)),
            description: c.description || "Kompetitor terdeteksi dari pencarian spasial Google Maps."
          };
        });
        setCompetitors(mappedReal);
      }
    } catch (err: any) {
      console.error("CLI Analysis Error:", err);
      setError(err.message || "Terjadi kesalahan sambungan analisis.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger analysis automatically on first load to make it instantly rich
  useEffect(() => {
    handleAnalyzeLocation();
  }, [locationName]);

  // Rent Assessment Warning indicator thresholds
  const rentStatus = useMemo(() => {
    const isOverLimit = monthlyRent > 20000000;
    return {
      isOverLimit,
      badgeText: isOverLimit ? "OVERBUDGET WARNING (> Rp 20 Juta)" : "ANGGARAN RAPI (Aman & Ideal)",
      colorClass: isOverLimit ? "bg-red-500/10 text-red-500 border-red-500/30" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    };
  }, [monthlyRent]);

  // Scoring Level Color helper
  const getScoreColor = (score: number) => {
    if (score >= 80) return { text: "text-emerald-400", border: "border-emerald-500", bg: "bg-emerald-500/5", badge: "SANGAT LAYAK (REKOMENDASI)" };
    if (score >= 60) return { text: "text-amber-400", border: "border-amber-500", bg: "bg-amber-500/5", badge: "RENDAH RESIKO (LAYAK DENGAN CATATAN)" };
    return { text: "text-red-500", border: "border-red-500", bg: "bg-red-500/5", badge: "RESIKO TINGGI (KURANG LAYAK)" };
  };

  const scoreMeta = analysisResult ? getScoreColor(analysisResult.feasibilityScore) : { text: "text-slate-400", border: "border-slate-800", bg: "bg-slate-900", badge: "WAITING ANALYSIS" };

  // Mathematical geocoordinate projector for competitors around a given center
  const getCompetitorLatLng = (
    cLat: number,
    cLng: number,
    distance: number,
    angle: number | undefined,
    index: number
  ) => {
    const finalAngle = angle !== undefined ? angle : (index * 45) % 360;
    const angleRad = (finalAngle * Math.PI) / 180;
    
    // Aligning precisely with the visual coordinate system of the original SVG mockup:
    // nodeX used Math.cos (East-West / Longitude)
    // nodeY used Math.sin (North-South / Latitude, downwards in SVG, so negative latitude change)
    const cosLat = Math.cos((cLat * Math.PI) / 180);
    const offsetLng = (distance * Math.cos(angleRad)) / (111320 * cosLat);
    const offsetLat = -(distance * Math.sin(angleRad)) / 111320;
    
    return {
      lat: cLat + offsetLat,
      lng: cLng + offsetLng
    };
  };

  // 1. Hook to initialize Leaflet Map instance on mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check if map is already initialized
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    // Add zoom controls at the bottom-right of the map container
    L.control.zoom({ position: "bottomright" }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Hook to update layers, circle, proposed spot, and competitor pins on state changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Smooth panning to new center location
    map.setView([centerLat, centerLng], map.getZoom());

    // Clear previous layers
    map.eachLayer((layer) => {
      map.removeLayer(layer);
    });

    // Add clean tile layer based on map theme (Dark Matter or Positron)
    const tileUrl = mapTheme === "DARK"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

    const tileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

    L.tileLayer(tileUrl, {
      attribution: tileAttribution,
      maxZoom: 20
    }).addTo(map);

    // Draw proposed radius circle (faint colored area indicating range)
    const circleColor = mapTheme === "DARK" ? "#f2ac7e" : "#854629";
    L.circle([centerLat, centerLng], {
      radius: radius,
      color: circleColor,
      weight: 2,
      dashArray: "6, 6",
      fillColor: circleColor,
      fillOpacity: 0.04
    }).addTo(map);

    // Draw helper concentric rings at 500m & 1000m for visual guide
    L.circle([centerLat, centerLng], {
      radius: 500,
      color: "rgba(255, 255, 255, 0.08)",
      weight: 1,
      fill: false,
      dashArray: "3, 3"
    }).addTo(map);

    L.circle([centerLat, centerLng], {
      radius: 1000,
      color: "rgba(255, 255, 255, 0.08)",
      weight: 1,
      fill: false,
      dashArray: "3, 3"
    }).addTo(map);

    // Proposed central outlet icon
    const centerIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <span class="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-amber-500/40"></span>
          <div class="relative rounded-full h-7 w-7 bg-[#2f1811] border-2 border-[#f2ac7e] flex items-center justify-center shadow-2xl">
            <span class="text-[10px] font-black text-[#f2ac7e]">★</span>
          </div>
        </div>
      `,
      className: "custom-center-pin",
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    // Place marker for Proposed Coraq Coffee Location
    const centerMarker = L.marker([centerLat, centerLng], { icon: centerIcon }).addTo(map);
    centerMarker.bindPopup(`
      <div class="bg-slate-950 text-white border border-slate-800 p-2.5 rounded-xl shadow-xl font-sans" style="min-width: 170px;">
        <h4 class="font-extrabold text-xs text-[#f2ac7e] tracking-widest text-center uppercase">★ CORAQ COFFEE ★</h4>
        <div class="w-full h-[1px] bg-slate-800/80 my-1.5"></div>
        <p class="text-[10px] text-slate-450 font-semibold text-center leading-relaxed">
          Rencana Lokasi Baru<br/>
          <span class="text-[#f2ac7e] text-[9px] font-mono">${centerLat.toFixed(5)}, ${centerLng.toFixed(5)}</span>
        </p>
      </div>
    `);

    // Plot competitors as custom pins on Leaflet
    competitors.forEach((comp, idx) => {
      const isOutsideRange = comp.distance > radius;
      const compCoords = getCompetitorLatLng(centerLat, centerLng, comp.distance, comp.angle, idx);

      const isNational = comp.type === "NATIONAL";
      const compColor = isNational ? "#ef4444" : "#0ea5e9";
      
      const markerHtml = `
        <div class="relative transition-all duration-300 transform hover:scale-125 hover:z-[9999] ${isOutsideRange ? 'opacity-30' : ''}">
          <div class="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-lg cursor-pointer" style="background-color: ${compColor};">
            <span class="text-[10px] font-black text-white">${isNational ? 'N' : 'L'}</span>
          </div>
        </div>
      `;

      const competitorIcon = L.divIcon({
        html: markerHtml,
        className: "custom-competitor-pin",
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const compMarker = L.marker([compCoords.lat, compCoords.lng], { icon: competitorIcon }).addTo(map);

      // Popup content styled beautifully with tailwind
      const popupContent = `
        <div class="bg-slate-950 text-white border border-slate-800 p-2.5 rounded-xl shadow-xl font-sans" style="min-width: 200px;">
          <div class="flex items-center justify-between gap-2">
            <h4 class="font-extrabold text-xs text-white">${comp.name}</h4>
            <span class="text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded-full ${isNational ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'} uppercase">${comp.type}</span>
          </div>
          <div class="flex items-center gap-1 mt-1">
            <span class="text-amber-400 text-xs">★</span>
            <span class="text-xs font-bold text-slate-300">${comp.rating || '4.5'}</span>
            <span class="text-slate-500 text-[10px]">•</span>
            <span class="text-[10px] text-slate-400 font-medium">${comp.distance}m</span>
          </div>
          ${comp.description ? `<p class="text-[10px] text-slate-400 leading-snug mt-1.5 font-medium border-t border-slate-800/60 pt-1.5">${comp.description}</p>` : ''}
        </div>
      `;

      compMarker.bindPopup(popupContent);

      compMarker.on("mouseover", () => {
        setHoveredCompId(comp.id);
      });
      compMarker.on("mouseout", () => {
        setHoveredCompId(null);
      });
    });

    // Handle clicks on map to set proposed spot coordinates
    map.off("click");
    map.on("click", (e: any) => {
      const { lat, lng } = e.latlng;
      setCenterLat(lat);
      setCenterLng(lng);
      
      const baseName = locationName.split(" (Plotted")[0].split(" (Geografis")[0];
      setLocationName(`${baseName} (Geografis ${lat.toFixed(5)}, ${lng.toFixed(5)})`);
    });

  }, [centerLat, centerLng, competitors, radius, mapTheme]);

  // Preset Map colors styling dictionaries to mimic rich high precision open maps
  const mapThemeStyles = useMemo(() => {
    if (mapTheme === "DARK") {
      return {
        bg: "bg-[#0b1322]",
        water: "#1e293b",
        parks: "#112220",
        edu: "#211a2f",
        commercial: "#2c1e20",
        roadMain: "#334155",
        roadSec: "#1e293b",
        roadBorder: "#475569",
        gridLine: "#1e293b",
        textDefault: "fill-slate-400",
        textSecondary: "fill-slate-500"
      };
    } else {
      // Classic Google Maps Light style colors
      return {
        bg: "bg-[#f4f3f0]",
        water: "#c2e0f9",
        parks: "#d6f2d6",
        edu: "#e6e2f2",
        commercial: "#fcece7",
        roadMain: "#ffffff",
        roadSec: "#ffffff",
        roadBorder: "#dedbd4",
        gridLine: "#eae7e0",
        textDefault: "fill-slate-700",
        textSecondary: "fill-slate-550"
      };
    }
  }, [mapTheme]);

  return (
    <div className="space-y-6" id="cli-container">
      {/* Dynamic Heading with Branding and Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 relative overflow-hidden" id="cli-header">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="flex items-start gap-4">
          <div className="bg-brand-500/10 p-3 rounded-xl text-brand-400 border border-brand-500/20 animate-pulse">
            <MapIcon size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-1">Coraq Location Intelligence</h2>
              <span className="bg-brand-505 text-slate-950 bg-brand-400 font-extrabold text-[12px] px-2.5 py-0.5 rounded-full shadow border border-brand-300">CLI v1.5</span>
            </div>
            <p className="text-sm text-slate-400 max-w-2xl">
              Sistem pemetaan outlet cerdas berbasis spasial GIS & kecerdasan artifisial (Gemini). Deteksi kompetitor merek nasional harian, hitung rasio sewa strategis, dan telaah kelayakan finansial sebelum menyewa lokasi baru.
            </p>
          </div>
        </div>
        <button
          onClick={handleAnalyzeLocation}
          disabled={loading}
          className="bg-brand-400 hover:bg-brand-500 text-slate-950 font-extrabold px-5 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          id="btn-reanalyze-cli"
        >
          {loading ? (
            <RefreshCw className="animate-spin text-slate-950" size={18} />
          ) : (
            <Sparkles className="text-slate-950" size={18} />
          )}
          {loading ? "Mengevaluasi Spasial..." : "Kalkulasi Feasibility AI"}
        </button>
      </div>

      {/* Grid: 2 Columns - Input Panel & Simulator Map Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Input Controls) - spans 5 */}
        <div className="lg:col-span-5 space-y-6">
          {/* Preset Buttons Quick Select & Blue Ocean Location Finder */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5" id="cli-presets">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold tracking-wider uppercase text-white flex items-center gap-2">
                <MapPin size={16} className="text-brand-400" /> Alternatif Penggunaan Cepat ("Preset Lokasi")
              </h3>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black px-2 py-0.5 rounded-full select-none">
                Saran Potensial
              </span>
            </div>
            
            <p className="text-xs text-slate-400 mb-4 leading-normal">
              Filter Provinsi & Kota/Kabupaten untuk secara otomatis menyajikan lokasi potensial dengan tingkat kompetisi yang rendah (Blue Ocean Spots).
            </p>

            {/* Hierarchical Filter Dropdowns */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Pilih Provinsi</label>
                <select
                  value={selectedProvince}
                  onChange={(e) => {
                    const prov = e.target.value;
                    setSelectedProvince(prov);
                    const listReg = REGENCY_MAP[prov];
                    setSelectedRegency(listReg && listReg.length > 0 ? listReg[0] : "Semua Kota/Kabupaten");
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-brand-500"
                >
                  {PROVINCES.map(prov => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Pilih Kota / Kab</label>
                <select
                  value={selectedRegency}
                  onChange={(e) => setSelectedRegency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-brand-500"
                >
                  {(REGENCY_MAP[selectedProvince] || ["Semua Kota/Kabupaten"]).map(reg => (
                    <option key={reg} value={reg}>{reg}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Potential Sweet Spots Lists */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-extrabold tracking-widest text-[#f2ac7e] uppercase border-b border-slate-800/80 pb-1 flex items-center gap-1.5">
                <Sparkles size={11} className="text-[#f2ac7e]" /> Rekomendasi Titik Biru (Low National Competitors)
              </h4>
              
              {filteredSweetSpots.length === 0 ? (
                <div className="text-center py-4 bg-slate-950/40 rounded-xl border border-slate-850 text-slate-500 text-xs italic">
                  Belum ada usulan Blue Ocean spot di saringan ini. Coba ganti Provinsi atau pilih "Semua Provinsi".
                </div>
              ) : (
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 no-scrollbar">
                  {filteredSweetSpots.map((spot) => {
                    const isSelected = locationName === spot.name;
                    return (
                      <div
                        key={spot.name}
                        onClick={() => handleSelectSweetSpot(spot)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-brand-500/10 border-brand-400 ring-1 ring-brand-400/30"
                            : "bg-slate-950 hover:bg-slate-850 border-slate-800"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-extrabold text-xs text-slate-200 block truncate max-w-[210px] sm:max-w-xs">{spot.name}</span>
                          <span className="text-[9px] shrink-0 font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded">
                            {spot.nationalCount === 0 ? "Nol Pesaing N" : "Minim Pesaing N"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                          {spot.description}
                        </p>
                        <div className="flex items-center justify-between text-[10px] font-black text-slate-550 uppercase mt-2 pt-1.5 border-t border-slate-850/40">
                          <span className="text-[#fbbf24]">Sewa: Rp {(spot.rent / 1000000).toFixed(1)} Jt/Bln</span>
                          <span className="text-brand-300 tracking-wide flex items-center gap-1">
                            Pilih Spot & Plot <ChevronRight size={10} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick shortcuts tab to render the raw base preset values */}
            <div className="mt-4 pt-3 border-t border-slate-850/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Preset Regional Utama:</span>
              <div className="flex gap-1.5 flex-wrap">
                {PRESET_LOCATIONS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handleSelectPreset(preset)}
                    className={`py-1 px-2.5 text-[10px] font-bold rounded-lg border transition-all ${
                      locationName === preset.name
                        ? "bg-brand-400/20 border-brand-400 text-brand-300"
                        : "bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {preset.name.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form Parameters Settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5" id="cli-form">
            <h3 className="text-sm font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
              <Sliders size={16} className="text-brand-400" /> Parameter Lokasi Outlet
            </h3>

            {/* Location Input Name & Autocomplete Suggestions Dropdown */}
            <div className="space-y-2 relative">
              <label className="block text-xs font-semibold text-slate-400 uppercase">Nama Outlet / Jalan Area</label>
              <div className="relative">
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => {
                    setLocationName(e.target.value);
                    setAnalysisResult(null);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => {
                    // Slight sleep delay to allow mouse down on suggestions list to proceed
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  placeholder="Ketik nama jalan/wilayah baru..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-4 py-3 pl-10 text-white text-sm focus:outline-none transition-colors"
                />
                <Search className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              </div>

              {/* Suggestions Dropdown View */}
              {showSuggestions && activeSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto py-1">
                  <div className="px-3 py-1 text-[9px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-900 pb-1 mb-1">
                    Saran Alamat Presisi (Makassar, Bandung, Jakarta, dll)
                  </div>
                  {activeSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.name}
                      onMouseDown={() => handleSelectSuggestion(suggestion)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 text-slate-300 transition-colors flex items-center gap-2 border-b border-slate-900/40 last:border-0"
                    >
                      <MapPin size={11} className="text-brand-400 shrink-0" />
                      <div className="truncate">
                        <span className="font-extrabold block text-slate-200 truncate">{suggestion.name}</span>
                        <span className="text-[10px] text-slate-500">Estimasi Sewa: Rp {(suggestion.rent/1000000).toFixed(1)} Jt/bln</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Monthly Lease Rate (with warning baseline > 20M) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-slate-400 uppercase">Biaya Sewa Tempat / bln</label>
                <span className={`text-[11px] px-2.5 py-0.5 font-extrabold rounded-full border text-xs leading-none ${rentStatus.colorClass}`}>
                  {rentStatus.badgeText}
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={monthlyRent}
                  onChange={(e) => {
                    setMonthlyRent(Number(e.target.value));
                    setAnalysisResult(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-4 py-3 pl-12 text-white font-black text-sm focus:outline-none transition-colors"
                />
                <div className="absolute left-4 top-3.5 text-brand-400 font-extrabold text-sm">Rp</div>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Sistem mendenda kelayakan secara ketat jika biaya sewa di atas <span className="text-red-400 font-bold">Rp 20.000.000 / bulan</span>.
              </p>
            </div>

            {/* Slider Radian Coverage (500m s/d 3km) */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-semibold uppercase">
                <span className="text-slate-400">Radius Deteksi Kompetitor</span>
                <span className="text-brand-400 font-black">{(radius / 1000).toFixed(1)} km ({radius}m)</span>
              </div>
              <input
                type="range"
                min="500"
                max="3000"
                step="100"
                value={radius}
                onChange={(e) => {
                  setRadius(Number(e.target.value));
                  setAnalysisResult(null);
                }}
                className="w-full accent-brand-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                <span>500 m</span>
                <span>1.5 km (Optimal)</span>
                <span>3.0 km</span>
              </div>
            </div>
          </div>

          {/* Add Manual Competitor Panel for Draggable Scanner Simulation */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6" id="cli-manual-competitor-form">
            <h3 className="text-sm font-semibold tracking-wider text-slate-300 uppercase mb-4 flex items-center gap-2">
              <Plus size={16} className="text-brand-400" /> Plot Baru Kompetitor Kompetitif
            </h3>
            <form onSubmit={handleAddCompetitor} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Nama Kedai/Brand</label>
                  <input
                    type="text"
                    value={newCompName}
                    onChange={(e) => setNewCompName(e.target.value)}
                    placeholder="misal: Starbucks Drive-Thru"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Jarak Radius (Meter)</label>
                  <input
                    type="number"
                    min="10"
                    max="3500"
                    value={newCompDistance}
                    onChange={(e) => setNewCompDistance(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-400 font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 justify-between pt-1">
                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-300">
                    <input
                      type="radio"
                      name="compType"
                      checked={newCompType === "LOCAL"}
                      onChange={() => setNewCompType("LOCAL")}
                      className="accent-brand-400"
                    />
                    Kedai Kopi Lokal
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-300">
                    <input
                      type="radio"
                      name="compType"
                      checked={newCompType === "NATIONAL"}
                      onChange={() => setNewCompType("NATIONAL")}
                      className="accent-brand-400"
                    />
                    Franchise Nasional
                  </label>
                </div>
                <button
                  type="submit"
                  className="bg-brand-500/10 hover:bg-brand-400 hover:text-slate-950 border border-brand-400/30 text-brand-300 text-xs font-extrabold px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-inner shrink-0"
                >
                  Plot Spot <ChevronRight size={12} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column (Visual Radar/Styled Maps GIS Simulator) - spans 7 */}
        <div className="lg:col-span-7 space-y-6">
          {/* HIGH-FIDELITY VECTOR STYLED MAP PANELS */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col items-center relative overflow-hidden" id="cli-radar-canvas">
            
            {/* Map Header Overlay inside Card */}
            <div className="w-full flex justify-between items-center mb-3.5 z-10 px-1">
              <div className="flex flex-col">
                <span className="text-sm font-black text-slate-200 tracking-tight flex items-center gap-1.5">
                  <Globe size={15} className="text-brand-400 animate-spin-slow" /> Peta Spasial Geografis ({activePreset.name})
                </span>
                <span className="text-[10px] text-slate-450 italic mt-0.5">Drag mouse untuk menggeser, Scroll / Gunakan tombol zoom</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Theme selection toggle to match Google Map styles */}
                <button 
                  onClick={() => setMapTheme(mapTheme === "DARK" ? "CLASSIC_LIGHT" : "DARK")}
                  className="p-1 px-2 text-[10px] bg-slate-950 border border-slate-800 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1"
                >
                  <Layers size={11} className="text-brand-400" /> Style: {mapTheme === "DARK" ? "Dark Mode" : "Classic Light"}
                </button>
              </div>
            </div>

            {/* Interactive Draggable Map Container */}
            <div 
              className="relative w-full aspect-[4/3] rounded-2xl border border-slate-800/80 overflow-hidden shadow-inner select-none"
              id="map-canvas-viewport"
            >
              <div ref={mapContainerRef} className="w-full h-full z-10" id="leaflet-map-element"></div>

              {/* Dynamic Legend floating inside map */}
              <div className="absolute top-4 right-4 z-[1000] bg-slate-950/80 border border-slate-800/40 p-2.5 rounded-xl text-[9px] text-slate-300 hidden sm:block pointer-events-none space-y-1">
                <div className="font-extrabold pb-0.5 border-b border-slate-800 text-white select-none">LEGENDA PETA</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-[#0ea5e9]"></span> Outlet Kopi Lokal</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-[#ef4444]"></span> Kopi Nasional/Franchise</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border border-dashed border-[#f2ac7e]"></span> Jangkauan Radius</div>
              </div>
            </div>

            {/* Map Legends and Controls summary stats */}
            <div className="w-full grid grid-cols-4 gap-2.5 mt-3">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center flex flex-col justify-center">
                <span className="text-xs text-slate-450 font-bold block leading-none">SEWA SEBULAN</span>
                <span className="text-sm font-extrabold text-white mt-1">Rp {(monthlyRent / 1000000).toFixed(1)} Jt</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center flex flex-col justify-center">
                <span className="text-xs text-slate-450 font-bold block leading-none">NASIONAL (N)</span>
                <span className="text-sm font-extrabold text-red-500 mt-1">{metrics.nationalCount} Outlet</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center flex flex-col justify-center">
                <span className="text-xs text-slate-450 font-bold block leading-none">WARKOP LOKAL (L)</span>
                <span className="text-sm font-extrabold text-[#0ea5e9] mt-1">{metrics.localCount} Gerai</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center flex flex-col justify-center">
                <span className="text-xs text-slate-450 font-bold block leading-none">DENSITAS SPASIAL</span>
                <span className={metrics.totalCount >= 5 ? "text-red-400 text-sm font-extrabold mt-1" : "text-emerald-400 text-sm font-extrabold mt-1"}>
                  {metrics.totalCount >= 5 ? "PADAT" : "OPTIMAL"}
                </span>
              </div>
            </div>
          </div>

          {/* Competitors List Panel with Hover Synced Highlight */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5" id="cli-competitors-list">
            <h3 className="text-xs font-bold tracking-wider uppercase text-slate-450 mb-3 block">
              Daftar Kompetitor Terplot Spasial ({competitors.length} outlet terdaftar)
            </h3>
            {competitors.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">Belum ada kompetitor yang dipetakan harian.</div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2 custom-scroll no-scrollbar">
                {competitors.map((comp) => {
                  const isInRadius = comp.distance <= radius;
                  const isHovered = hoveredCompId === comp.id;
                  
                  return (
                    <div
                      key={comp.id}
                      onMouseEnter={() => setHoveredCompId(comp.id)}
                      onMouseLeave={() => setHoveredCompId(null)}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-xs border transition-all ${
                        isHovered 
                          ? "bg-slate-950 border-brand-400 shadow scale-[1.01]" 
                          : isInRadius 
                            ? "bg-slate-950 border-slate-800" 
                            : "bg-slate-900/30 border-slate-850/50 opacity-30"
                      }`}
                    >
                      <div className="flex flex-col min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${comp.type === "NATIONAL" ? "bg-red-500 animate-pulse" : "bg-sky-500"}`}></span>
                          <span className="font-extrabold text-slate-200 truncate max-w-[150px] md:max-w-[180px]" title={comp.name}>{comp.name}</span>
                          <span className="opacity-60 text-[10px] flex-shrink-0">({comp.distance}m)</span>
                        </div>
                        {comp.description && (
                          <p className="text-[10px] text-slate-450 mt-0.5 pl-3.5 leading-snug truncate max-w-[210px]" title={comp.description}>
                            {comp.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-yellow-400 font-extrabold bg-yellow-405/5 border border-yellow-500/25 px-2 py-0.5 rounded-lg">★ {comp.rating}</span>
                        <button
                          onClick={() => handleRemoveCompetitor(comp.id)}
                          className="text-red-500 hover:text-red-400 p-1 rounded-md transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION: AI Analysis Results - Feasibility Report Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden" id="cli-analysis-box">
        <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
          <Sparkles className="text-brand-400 animate-pulse" size={20} /> Laporan Keberhasilan & Kelayakan Finansial AI Coraq
        </h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3" id="cli-loader">
            <RefreshCw className="animate-spin text-brand-400" size={40} />
            <div className="text-sm font-semibold tracking-wide">Menjalankan Engine Analitis Spasial Coraq...</div>
            <p className="text-xs text-slate-500">Mengkalkulasi sewaan tempat, menilai margin sirkulasi, dan mengobservasi kompetitor pasar regional Makassar/Dago</p>
          </div>
        ) : error ? (
          <div className="bg-red-950/20 border border-red-900/50 p-6 rounded-2xl text-center" id="cli-error">
            <ShieldAlert className="text-red-500 mx-auto mb-2" size={32} />
            <p className="text-sm text-red-300 font-bold">{error}</p>
            <p className="text-xs text-slate-500 mt-1">Harap klik Proses Analisis AI ulang atau periksa status konfigurasi server Anda.</p>
          </div>
        ) : analysisResult ? (
          <div className="space-y-6" id="cli-report-content">
            {/* Feasibility Score Radial progress & Status Badge Card */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-950 p-6 rounded-2xl border border-slate-800/80">
              {/* Left Radial progress chart / Score */}
              <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-3 border-b md:border-b-0 md:border-r border-slate-850">
                <div className="relative w-36 h-36 flex items-center justify-center rounded-full bg-slate-900 shadow-md">
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle
                      cx="72"
                      cy="72"
                      r="62"
                      className="stroke-slate-800"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="72"
                      cy="72"
                      r="62"
                      className={`stroke-current ${scoreMeta.text}`}
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 62}
                      strokeDashoffset={2 * Math.PI * 62 * (1 - analysisResult.feasibilityScore / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="flex flex-col items-center">
                    <span className="text-4xl font-extrabold text-white">{analysisResult.feasibilityScore}</span>
                    <span className="text-[10px] text-slate-400 font-black tracking-widest leading-none uppercase mt-1">Feasibility Kelayakan</span>
                  </div>
                </div>
                <div className={`mt-4 font-black text-xs px-3 py-1.5 rounded-full border uppercase ${scoreMeta.text} ${scoreMeta.border} ${scoreMeta.bg}`}>
                  {scoreMeta.badge}
                </div>
              </div>

              {/* Right Summary Metrics */}
              <div className="md:col-span-8 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-900 p-4 border border-slate-800 rounded-xl">
                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-wider text-brand-300">Payback Period (ROI)</div>
                    <div className="text-xl font-extrabold text-white mt-1">{analysisResult.paybackPeriodMonths} Bulan</div>
                    <div className="text-[9px] text-slate-450 mt-1 font-medium">Estimasi pengembalian modal awal investasi outlet baru.</div>
                  </div>
                  <div className="bg-slate-900 p-4 border border-slate-800 rounded-xl">
                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-wider text-brand-300">BEP Volume Harian</div>
                    <div className="text-xl font-extrabold text-white mt-1">~{analysisResult.bepCupsDaily || analysisResult.bepHours || 80} Cup/Hari</div>
                    <div className="text-[9px] text-slate-450 mt-1 font-medium">Volume mimimum kopi susu aren terjual per hari untuk menutup sewa ruko.</div>
                  </div>
                </div>

                {/* Sentiment & Threat assessment details */}
                <div className="space-y-3 pt-2">
                  <div className="flex gap-2">
                    <div className="p-1.5 bg-brand-500/10 text-brand-400 rounded-md shrink-0 h-8 w-8 flex items-center justify-center">
                      <TrendingUp size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-300">Sentimen Pasar Spasial ({activePreset.sentiment})</div>
                      <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{analysisResult.sentimentAnalysis}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="p-1.5 bg-red-500/10 text-red-500 rounded-md shrink-0 h-8 w-8 flex items-center justify-center">
                      <ShieldAlert size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-300">Intensitas & Ancaman Pesaing</div>
                      <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{analysisResult.competitorThreatLevel}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Warn Status Lease Warning Banner */}
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-3">
              <div className="text-amber-400 pt-0.5"><AlertTriangle size={18} /></div>
              <div>
                <div className="text-xs font-black text-amber-300">Catatan Analisis Biaya Sewa Pasca Sewa</div>
                <p className="text-xs text-slate-405 text-slate-300 leading-relaxed mt-1">{analysisResult.rentWarning}</p>
              </div>
            </div>

            {/* Pricing strategy advisory & Regulatory Feasibilities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850">
                <h4 className="text-xs font-black uppercase text-brand-300 tracking-wider mb-2.5">Rekomendasi Pricing & Diferensiasi Menu</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{analysisResult.pricingStrategy}</p>
              </div>
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850">
                <h4 className="text-xs font-black uppercase text-brand-300 tracking-wider mb-2.5 font-serif">Kepatuhan Hukum & Legalitas Kawasan</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{activePreset.name.includes("Makassar") ? "Zonasi komersial Tamalanrea sangat aman. Pengurusan NIB (Nomor Induk Berusaha) dapat dilakukan via satu pintu OSS RBA. Pastikan rasio daya tampung parkir mendukung perputaran cepat pengambilan pesanan (Self-Pickup/Pager)." : "Zonasi komersial aman. Pengurusan NIB (Nomor Induk Berusaha) dapat dilakukan via satu pintu OSS RBA. Pastikan rasio daya tampung parkir mendukung perputaran cepat pengambilan pesanan."}</p>
              </div>
            </div>

            {/* Launch Playbook Checklist Actions */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850">
              <h4 className="text-xs font-black uppercase text-brand-300 tracking-widest mb-4 flex items-center gap-1.5 font-serif">
                <CheckCircle size={14} className="text-brand-400" /> CLI Strategic Marketing Playbook: Launching Strategis
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analysisResult.marketingPlaybook?.map((step: string, idx: number) => (
                  <div key={idx} className="bg-slate-900/50 p-4 rounded-xl border border-slate-850/30 flex items-start gap-2.5 relative">
                    <span className="absolute top-2 right-3 text-slate-700 text-lg font-black">{idx + 1}</span>
                    <div className="text-brand-400 pt-1 shrink-0"><CheckCircle size={14} /></div>
                    <p className="text-xs text-slate-400 leading-relaxed pr-2 font-medium">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sources of analysis Citations represented nicely */}
            {sources.length > 0 && (
              <div className="pt-2 flex items-center gap-2 border-t border-slate-850 text-slate-500">
                <BookOpen size={13} className="text-slate-500" />
                <span className="text-[10px] font-semibold tracking-wider uppercase">Citations & Grounding:</span>
                <div className="flex gap-2 flex-wrap text-slate-300">
                  {sources.map((source, index) => (
                    <a
                      key={index}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-brand-400 hover:underline font-bold bg-slate-950 border border-slate-850/65 px-2 py-0.5 rounded flex items-center gap-1"
                    >
                      {source.title} {isApiFallback ? "" : "↗"}
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            {/* Status indicators */}
            {isApiFallback ? (
              <div className="text-center text-[10px] text-slate-600 font-extrabold italic bg-slate-950/20 py-2 border-t border-dashed border-slate-900 rounded-b-2xl">
                ⚠️ Menampilkan Hasil kalkulasi model fallback Coraq Coffee karena limit kuota/sambungan Gemini API terlampaui.
              </div>
            ) : (
              <div className="text-center text-[10px] text-slate-500 font-bold bg-brand-500/5 py-2 border-t border-dashed border-brand-950/20 rounded-b-2xl">
                ⚡ Hasil analisis AI di-grounding secara real-time via pencarian regional Google Search.
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-14 text-slate-500 text-xs">
            Isi parameter lokasi di atas dan tekan tombol &quot;Proses Analisis AI&quot; untuk mengaktifkan pemetaan kelayakan.
          </div>
        )}
      </div>
    </div>
  );
};
