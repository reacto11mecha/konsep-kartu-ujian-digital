const fs = require("fs");
const path = require("path");
const { default: Steganography } = require("any-steganography");

const resultPath = path.join(__dirname, "..", "001-ekstraksi-data", "result");

if (!fs.existsSync(resultPath)) throw new Error("Belum ada hasil scraping!");

const dir = fs.readdirSync(resultPath);

dir.forEach((folder, index) => {
  const concatedFile = JSON.parse(
    Steganography.decode(
      fs.readFileSync(path.join(resultPath, folder, `${folder}.pdf`)),
      "pdf"
    )
  );
  const jsonData = JSON.parse(
    fs.readFileSync(path.join(resultPath, folder, "digital-card.json"))
  );

  if (index > 1) console.log();

  console.log(
    `> Nama Peserta: ${
      concatedFile.user.nama === jsonData.user.nama
        ? jsonData.user.nama
        : "Nama Tidak Sama! Ada Error!"
    }`
  );
  console.log(
    `> Kelas Peserta: ${
      concatedFile.user.kelas === jsonData.user.kelas
        ? jsonData.user.kelas
        : "Kelas  Tidak Sama! Ada Error!"
    }`
  );

  console.log();

  console.log(
    `> Status Dokumen: ${
      JSON.stringify(concatedFile) === JSON.stringify(jsonData)
        ? "SAMA"
        : "TIDAK"
    }`
  );
});
