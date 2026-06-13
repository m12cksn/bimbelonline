export type GradeCard = {
  id: number;
  level: number;
  name: string;
  description: string;
  imageUrl: string;
};

const descriptions = [
  "Belajar mengenal bilangan, pola, bentuk, dan operasi hitung dasar dengan cara yang menyenangkan.",
  "Menguatkan kemampuan berhitung, pengukuran, pecahan sederhana, dan pemecahan masalah sehari-hari.",
  "Menjelajahi bilangan, kalimat matematika, pengukuran, bangun datar, serta penyajian data.",
  "Mempelajari bilangan cacah, pecahan, pola, pengukuran, bangun datar, dan diagram.",
  "Mengembangkan pemahaman bilangan, KPK dan FPB, pecahan, luas, sudut, serta bangun ruang.",
  "Mendalami pecahan, desimal, rasio, kubus, balok, peluang, dan soal pemecahan masalah.",
  "Membangun dasar matematika SMP melalui bilangan, aljabar, perbandingan, dan geometri.",
  "Menguasai pola bilangan, koordinat, relasi, fungsi, persamaan, statistika, dan peluang.",
  "Mempersiapkan matematika tingkat lanjut melalui aljabar, geometri, transformasi, dan statistika.",
  "Mengembangkan kemampuan bernalar melalui fungsi, persamaan, trigonometri, dan analisis data.",
  "Mendalami matematika lanjutan untuk pemodelan, limit, turunan, statistika, dan geometri.",
  "Memantapkan konsep matematika tingkat akhir sebagai bekal ujian dan pendidikan selanjutnya.",
];

export const defaultGradeCards: GradeCard[] = Array.from(
  { length: 12 },
  (_, index) => {
    const level = index + 1;
    return {
      id: level,
      level,
      name: `Kelas ${level}`,
      description: descriptions[index],
      imageUrl: `/images/classes/class-${level}.svg`,
    };
  },
);

export function mergeGradeCards(
  rows:
    | Array<{
        id?: number | null;
        level?: number | null;
        name?: string | null;
        description?: string | null;
        image_url?: string | null;
      }>
    | null
    | undefined,
) {
  const byLevel = new Map(
    (rows ?? [])
      .filter((row) => typeof row.level === "number")
      .map((row) => [row.level as number, row]),
  );

  return defaultGradeCards.map((fallback) => {
    const row = byLevel.get(fallback.level);
    return {
      id: typeof row?.id === "number" ? row.id : fallback.id,
      level: fallback.level,
      name: row?.name?.trim() || fallback.name,
      description: row?.description?.trim() || fallback.description,
      imageUrl: row?.image_url?.trim() || fallback.imageUrl,
    };
  });
}
