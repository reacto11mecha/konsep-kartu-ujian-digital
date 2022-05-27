type UserType = {
  nama: string;
  kelas: string;
  nomor_peserta: string;
  npsn: string;
  username: string;
  password: string;
};

type MapelType = {
  pelajaran: string;
  token: string[];
  waktu: string;
};

type jadwalType = {
  hari: string;
  tanggal: string;
  mapel: MapelType[];
};

export type IDigitalCard = {
  user: UserType;
  jadwal: jadwalType;
};
