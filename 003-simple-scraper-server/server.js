const { Cluster } = require("puppeteer-cluster");
const express = require("express");

const app = express();

(async () => {
  const scraperCluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 2,
  });
  scraperCluster.task(async ({ page, data: { uPIN } }) => {
    await page.goto(
      `https://kartuujian.sman12-bekasi.sch.id/cetakskl.php?nisn=${uPIN}`,
      {
        waitUntil: "networkidle2",
      }
    );

    const table = await page.$$("table");
    if (table.length < 1)
      throw new Error(`Tidak ada kartu dengan U-PIN: ${uPIN}`);

    await page.emulateMediaType("print");
    const pdfBuffer = await page.pdf({
      format: "A4",
      scale: 0.85,
    });

    const dataKartuDigital = await page.evaluate(() => {
      const jadwalRef = [...document.querySelectorAll('td[rowspan="4"]')];
      const [nama, kelas, nomorPeserta, npsn, kodeServer, username, password] = [
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
          kodeServer,
          username,
          password,
        },
        jadwal,
      };
    });

    return { json: dataKartuDigital, buffer: pdfBuffer };
  });

  app.get("/", (req, res) =>
    res.send(`Untuk mendapatkan file pdf, kunjungi /kartu-digital/&lt;U-PIN&gt; (tanpa tanda &lt; dan &gt;)
    <br /><br />
    Jika ingin mendapatkan kartu dalam bentuk json, kunjungi /json/&lt;U-PIN&gt; (tanpa tanda &lt; dan &gt;)`)
  );

  app.get("/kartu-digital/:upin", async function (req, res) {
    if (!req.params.upin)
      return res.json({ error: "Diperlukan sebuah U-PIN!" });

    if (req.params.upin.length <= 5)
      return res.json({
        error: "Panjang minimal dari U-PIN adalah 6 karakter!",
      });

    try {
      const digitalCard = await scraperCluster.execute({
        uPIN: req.params.upin,
      });

      const concatedBuffer = Buffer.concat([
        digitalCard.buffer,
        Buffer.from(JSON.stringify(digitalCard.json)),
      ]);

      res.setHeader(
        "Content-disposition",
        `attachment; filename=${digitalCard.json.user.npsn}_${digitalCard.json.user.nama}_${digitalCard.json.user.nomor_peserta}.pdf`
      );

      res.contentType("application/pdf");
      res.send(concatedBuffer);
    } catch (err) {
      res.json({ error: err.message });
    }
  });

  app.get("/json/:upin", async function (req, res) {
    if (!req.params.upin)
      return res.json({ error: "Diperlukan sebuah U-PIN!" });

    if (req.params.upin.length <= 5)
      return res.json({
        error: "Panjang minimal dari U-PIN adalah 6 karakter!",
      });

    try {
      const digitalCard = await scraperCluster.execute({
        uPIN: req.params.upin,
      });

      res.json(digitalCard.json);
    } catch (err) {
      res.json({ error: err.message });
    }
  });

  app.listen(3000, function () {
    console.log("Scraper server listening on port 3000.");
  });
})();
