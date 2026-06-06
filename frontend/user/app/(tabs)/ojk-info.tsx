import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RankBadge } from "@/components/RankBadge";
import { RANK_XP, RANK_LIMIT, RANK_RATE } from "@/constants/config";
import { rankColors } from "@/constants/colors";

const RANK_ORDER = ["Ruby", "Diamond", "Platinum", "Gold", "Silver", "Bronze", "Iron"] as const;

function formatLimit(n: number) {
  if (n === 0) return "Terkunci";
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(0)}jt`;
  return `Rp ${(n / 1_000).toFixed(0)}rb`;
}

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

      <View style={{ marginBottom: 28 }}>
        <Text style={{ color: "#fff", fontSize: 16, fontFamily: "DMSans_600SemiBold", marginBottom: 8 }}>
          Tingkatan Rank & Limit
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 21, marginBottom: 16 }}>
          Semakin tinggi rank Anda, semakin besar limit pinjaman bulanan dan semakin rendah suku bunga yang ditawarkan.
        </Text>

        <View>
          {RANK_ORDER.map((rank, index) => {
            const [xpMin, xpMax] = RANK_XP[rank];
            const limit = RANK_LIMIT[rank];
            const rate = RANK_RATE[rank];
            const rc = rankColors[rank];
            const isLast = index === RANK_ORDER.length - 1;
            const isFirst = index === 0;
            const lineColor = "rgba(255,255,255,0.08)";

            return (
              <View key={rank} style={{ flexDirection: "row" }}>
                <View style={{ width: 28, alignItems: "center" }}>
                  <View style={{
                    width: 2,
                    height: isFirst ? 20 : 16,
                    backgroundColor: isFirst ? "transparent" : lineColor,
                  }} />
                  <View style={{
                    width: 8,
                    height: 8,
                    borderRadius: 99,
                    backgroundColor: rc?.badge ?? "#9fe870",
                  }} />
                  {!isLast && (
                    <View style={{
                      width: 2,
                      flex: 1,
                      minHeight: 16,
                      backgroundColor: lineColor,
                    }} />
                  )}
                </View>

                <View style={{ flex: 1, paddingLeft: 12, paddingTop: 10, paddingBottom: isLast ? 16 : 0, borderBottomWidth: isLast ? 0 : 1, borderBottomColor: "rgba(255,255,255,0.06)" }}>
                  <View style={{ paddingBottom: isLast ? 0 : 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <RankBadge rank={rank} size={44} />
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: 16,
                          fontFamily: "DMSans_700Bold",
                          color: "#e8ebe6",
                          marginBottom: 3,
                        }}>
                          {rank}
                        </Text>
                        <Text style={{ fontSize: 11, color: "#525550", fontFamily: "DMSans_400Regular" }}>
                          {xpMax === Infinity
                            ? `${xpMin.toLocaleString("id-ID")}+ XP`
                            : `${xpMin.toLocaleString("id-ID")} – ${xpMax.toLocaleString("id-ID")} XP`}
                        </Text>
                      </View>
                    </View>

                    <View style={{
                      marginTop: 10,
                      flexDirection: "row", gap: 20, alignItems: "center",
                    }}>
                      {rank === "Iron" ? (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Ionicons name="lock-closed" size={12} color="#f87171" />
                          <Text style={{ fontSize: 11, color: "#f87171", fontFamily: "DMSans_400Regular" }}>
                            Tidak dapat mengajukan pinjaman
                          </Text>
                        </View>
                      ) : (
                        <>
                          <View>
                            <Text style={{ fontSize: 10, color: "#525550" }}>Limit Bulanan</Text>
                            <Text style={{ fontSize: 13, fontFamily: "DMSans_600SemiBold", color: "#e8ebe6" }}>
                              {formatLimit(limit)}
                            </Text>
                          </View>
                          <View>
                            <Text style={{ fontSize: 10, color: "#525550" }}>Bunga</Text>
                            <Text style={{ fontSize: 13, fontFamily: "DMSans_600SemiBold", color: "#e8ebe6" }}>
                              {rate}% p.a.
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <Text style={{ color: "rgba(255,255,255,0.20)", fontSize: 11, textAlign: "center", marginTop: 8 }}>
        Diperbarui: POJK 40/2024 · SEOJK 19/2025
      </Text>
    </ScrollView>
  );
}
