import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SECTIONS = [
  {
    title: "Tentang Cicilin",
    content:
      "Cicilin adalah platform pinjaman digital yang beroperasi sesuai dengan ketentuan Otoritas Jasa Keuangan (OJK) Republik Indonesia. Semua produk pinjaman kami dirancang untuk mendukung kebutuhan finansial Anda secara bertanggung jawab.",
  },
  {
    title: "Suku Bunga & Biaya",
    content:
      "Suku bunga dihitung secara flat sesuai dengan tenor pinjaman. Batas maksimum bunga harian mengikuti ketentuan OJK (SEOJK 19/2025): 0,20%/hari untuk pinjaman konsumtif. Total cicilan Anda tidak akan melebihi batas yang telah ditetapkan OJK.",
  },
  {
    title: "Batas Cicilan",
    content:
      "Sesuai ketentuan OJK, total kewajiban cicilan Anda dari seluruh platform pinjaman tidak boleh melebihi 40% dari penghasilan bulanan. Kami menyarankan Anda untuk meminjam hanya sesuai dengan kemampuan bayar.",
  },
  {
    title: "Hak Anda sebagai Peminjam",
    body: [
      "Mendapatkan penjelasan lengkap mengenai produk pinjaman sebelum menandatangani perjanjian.",
      "Mengetahui alasan penolakan pengajuan pinjaman.",
      "Mendapatkan perlindungan data pribadi sesuai UU PDP.",
      "Mengajukan keberatan atau komplain atas keputusan yang dianggap tidak adil.",
      "Mendapatkan jadwal angsuran yang jelas dan transparan.",
    ],
  },
  {
    title: "Kebijakan Privasi",
    content:
      "Data pribadi Anda (KTP, KK, foto selfie, rekening bank) disimpan secara aman dan hanya digunakan untuk keperluan verifikasi identitas dan penilaian kredit. Kami tidak membagikan data Anda kepada pihak ketiga tanpa persetujuan Anda, kecuali diwajibkan oleh hukum.",
  },
  {
    title: "Keamanan Akun",
    body: [
      "Jangan bagikan PIN atau password Anda kepada siapapun, termasuk petugas Cicilin.",
      "Cicilin tidak pernah meminta PIN melalui telepon atau pesan.",
      "Segera ubah PIN jika Anda merasa keamanan akun terancam.",
    ],
  },
  {
    title: "Risiko Pinjaman",
    content:
      "Pinjaman adalah kewajiban finansial yang harus dikembalikan sesuai jadwal. Keterlambatan pembayaran dapat berdampak pada penurunan skor kredit dan pengenaan denda. Pastikan Anda memahami seluruh kewajiban sebelum mengajukan pinjaman.",
  },
  {
    title: "Pengaduan & Bantuan",
    body: [
      "Layanan OJK: 157 (Senin–Jumat, 08.00–17.00 WIB)",
      "Email OJK: konsumen@ojk.go.id",
      "Website OJK: ojk.go.id",
      "Untuk pengaduan terkait Cicilin, hubungi layanan pelanggan melalui menu Profil.",
    ],
  },
];

export default function OjkInfoScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#0f0f0f" }}
      contentContainerStyle={{
        paddingTop: insets.top + 48,
        paddingBottom: insets.bottom + 40,
        paddingHorizontal: 24,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={{ color: "#fff", fontSize: 26, fontFamily: "DMSans_700Bold", marginBottom: 8 }}>
        OJK & Kebijakan
      </Text>
      <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 20, marginBottom: 32 }}>
        Ketentuan penggunaan, hak peminjam, dan informasi perlindungan konsumen sesuai regulasi OJK.
      </Text>

      {SECTIONS.map((section, i) => (
        <View key={i} style={{ marginBottom: 28 }}>
          <Text style={{ color: "#fff", fontSize: 16, fontFamily: "DMSans_600SemiBold", marginBottom: 8 }}>
            {section.title}
          </Text>

          {"content" in section && section.content ? (
            <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 21 }}>
              {section.content}
            </Text>
          ) : null}

          {"body" in section && section.body ? (
            <View style={{ gap: 6 }}>
              {section.body.map((item, j) => (
                <View key={j} style={{ flexDirection: "row", gap: 8 }}>
                  <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, lineHeight: 21 }}>•</Text>
                  <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 21, flex: 1 }}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ))}

      <Text style={{ color: "rgba(255,255,255,0.20)", fontSize: 11, textAlign: "center", marginTop: 8 }}>
        Diperbarui: POJK 40/2024 · SEOJK 19/2025
      </Text>
    </ScrollView>
  );
}
