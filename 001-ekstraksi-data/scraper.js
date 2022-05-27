/**
 * Ini adalah file contoh yang dapat digunakan untuk mengambil kartu,
 * mengekstrak data, dan menghasilkan kartu dengan data hasil steganography.
 * File ini bisa langsung dijalankan dengan menggunakan perintah,
 *
 * npm run scrape <U-PIN>
 *
 * atau
 *
 * pnpm scrape <U-PIN>
 *
 * Setelah menjalankan, silahkan cek folder result, akan ada file hasil
 * steganography, file asli, dan file json.
 */

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const uPIN = process.argv[2];

if (!uPIN) throw new Error("Diperlukan U-PIN!");

console.log(`> Memulai scraping data, U-PIN: ${uPIN}`);

const resultDir = path.join(__dirname, "result");
if (!fs.existsSync(resultDir)) fs.mkdirSync(resultDir);

(async () => {
  console.log("> Memulai instance puppeteer...");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  console.log("> Mengunjungi halaman kartu...");
  await page.goto(
    `https://kartuujian.sman12-bekasi.sch.id/cetakskl.php?nisn=${uPIN}`,
    {
      waitUntil: "networkidle2",
    }
  );

  console.log(`> Mengecek apakah halaman tidak kosong...`);
  const table = await page.$$("table");
  if (table.length < 1) {
    await browser.close();
    console.log(`U-PIN ${uPIN} tidak dapat ditemukan!`);
  }

  console.log("> Halaman tidak kosong, mengubah halaman menjadi PDF...");
  await page.emulateMediaType("print");
  const pdfBuffer = await page.pdf({
    format: "A4",
    scale: 0.85,
  });

  console.log("> Mengekstrak data dari halaman kartu...");
  const dataKartuDigital = await page.evaluate(() => {
    const jadwalRef = [...document.querySelectorAll('td[rowspan="4"]')];
    const [nama, kelas, nomorPeserta, npsn, username, password] = [
      ...document.querySelectorAll('table[width="800"]:nth-of-type(2) td b'),
    ]
      .filter((el) => el.parentElement.getAttribute("colspan") === "2")
      .map((el) => el.innerText.trim());

    const jadwal = jadwalRef.map((j) => {
      let data = [];
      let currentElement;

      const parent = j.parentElement;

      while (true) {
        const next =
          data.length < 1
            ? parent.nextElementSibling
            : currentElement.nextElementSibling;

        if (!next || next.querySelector('td[rowspan="4"]')) break;

        if (!next.querySelector("td").innerText.includes("-")) {
          const mapelElement = next.querySelector("td");
          const tokenElement = next.querySelector("td:nth-child(2)");
          const waktuElement = next.querySelector("td:nth-child(3)");

          const pelajaran = mapelElement.innerText.replace(/[0-9].\s/, "");
          const tokenStr = tokenElement.innerText;
          const token = tokenStr.includes("/")
            ? tokenStr.split(" / ")
            : [tokenStr];
          const waktu = waktuElement.innerText.replace("–", "-");

          data.push({
            pelajaran,
            token,
            waktu,
          });
        }

        currentElement = next;
      }

      const hariElement = parent.querySelector("th");
      const [hari, tanggal] = hariElement.innerText.split(", ");

      return {
        hari,
        tanggal,
        mapel: data,
      };
    });

    return {
      user: {
        nama,
        kelas,
        nomor_peserta: nomorPeserta,
        npsn,
        username,
        password,
      },
      jadwal,
    };
  });

  const basicFormat = `${dataKartuDigital.user.npsn}_${dataKartuDigital.user.nama}_${dataKartuDigital.user.nomor_peserta}`;
  const cardResultDir = path.join(resultDir, basicFormat);
  const jsonCardPath = path.join(cardResultDir, "digital-card.json");
  const realPDFPath = path.join(cardResultDir, `${basicFormat}_real.pdf`);
  const concatedPDFPath = path.join(cardResultDir, `${basicFormat}.pdf`);

  if (!fs.existsSync(cardResultDir)) fs.mkdirSync(cardResultDir);

  const concatedBuffer = Buffer.concat([
    pdfBuffer,
    Buffer.from(JSON.stringify(dataKartuDigital)),
  ]);

  console.log(`> Menyimpan file ke folder ${cardResultDir}`);
  fs.writeFileSync(jsonCardPath, JSON.stringify(dataKartuDigital, null, 2));
  fs.writeFileSync(realPDFPath, pdfBuffer);
  fs.writeFileSync(concatedPDFPath, concatedBuffer);

  console.log("> Berhasil menyimpan file, browser ditutup.");
  await browser.close();
})();
