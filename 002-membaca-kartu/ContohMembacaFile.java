import org.json.JSONArray;
import org.json.JSONObject;
import java.io.*;

class ContohMembacaFile {
  public static void main(String[] args) throws Exception {
    try {
      BufferedReader br = new BufferedReader(new FileReader("/path/ke/file.pdf"));

      StringBuilder sb = new StringBuilder();
      String line = br.readLine();

      while (line != null) {
        sb.append(line);
        sb.append(System.lineSeparator());
        line = br.readLine();
      }
      String asciiString = sb.toString();
      String jsonString = asciiString.substring(asciiString.indexOf("%%EOF") + 5);

      br.close();

      System.out.println(jsonString);

      JSONObject kartuDigital = new JSONObject(jsonString);
      JSONObject userData = kartuDigital.getJSONObject("user");
      JSONArray jadwalData = kartuDigital.getJSONArray("jadwal");

      System.out.println("============================");
      System.out.print("Nama: ");
      System.out.println(userData.getString("nama"));

      System.out.print("Kelas: ");
      System.out.println(userData.getString("kelas"));

      System.out.print("Nomor Peserta: ");
      System.out.println(userData.getString("nomor_peserta"));

      System.out.print("NPSN: ");
      System.out.println(userData.getString("nomor_peserta"));

      System.out.print("Username: ");
      System.out.println(userData.getString("username"));

      System.out.print("Password: ");
      System.out.println(userData.getString("password"));
      System.out.println("============================");

      System.out.println("\n");

      for (int i = 0; i < jadwalData.length(); i++) {
        JSONObject hari = jadwalData.getJSONObject(i);
        JSONArray mapel = hari.getJSONArray("mapel");

        System.out.println("===================");

        System.out.print(hari.getString("hari"));
        System.out.print(", ");
        System.out.println(hari.getString("tanggal"));

        for (int j = 0; j < mapel.length(); j++) {
          JSONObject pelajaran = mapel.getJSONObject(j);
          JSONArray token = pelajaran.getJSONArray("token");

          System.out.print("Mata Pelajaran: ");
          System.out.println(pelajaran.getString("pelajaran"));

          System.out.print("Waktu: ");
          System.out.println(pelajaran.getString("waktu"));

          System.out.print("Kode: ");
          if (token.length() < 2) {
            System.out.println(token.getString(0));
          } else {
            for (int k = 0; k < token.length(); k++) {
              System.out.print(token.getString(k));
              if (k < token.length() - 1) System.out.print(" / ");
            }

            System.out.println();
          }

          if (j < mapel.length() - 1) System.out.println();
        }

        System.out.println("===================");
        System.out.println();

      }
    } catch (ExceptionInInitializerError error) {
      System.out.println(error);
    }
  }
}
