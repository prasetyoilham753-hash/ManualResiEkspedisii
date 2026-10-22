import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { ArrowLeft, Trash2, Plus, Download, Printer, Truck, UserCheck } from 'lucide-react';

interface CourierConfig {
  id: string;
  name: string;
  code: string;
  defaultLayanan: string;
  headerBg: [number, number, number]; // RGB for PDF header
  headerTextColor: [number, number, number];
}

const COURIERS: CourierConfig[] = [
  {
    id: 'jnt',
    name: 'J&T Express',
    code: 'J&T',
    defaultLayanan: 'Regular',
    headerBg: [0, 0, 0],
    headerTextColor: [255, 255, 255]
  },
  {
    id: 'jne',
    name: 'JNE Express',
    code: 'JNE',
    defaultLayanan: 'REG',
    headerBg: [204, 0, 0], // JNE Red
    headerTextColor: [255, 255, 255]
  },
  {
    id: 'sicepat',
    name: 'SiCepat Ekspres',
    code: 'SICEPAT',
    defaultLayanan: 'REG',
    headerBg: [226, 35, 26], // SiCepat Red
    headerTextColor: [255, 255, 255]
  },
  {
    id: 'anteraja',
    name: 'Anteraja',
    code: 'ANTERAJA',
    defaultLayanan: 'Reguler',
    headerBg: [0, 150, 64], // Anteraja Green
    headerTextColor: [255, 255, 255]
  },
  {
    id: 'spx',
    name: 'Shopee Xpress',
    code: 'SPX',
    defaultLayanan: 'Standard',
    headerBg: [238, 77, 45], // Shopee Orange
    headerTextColor: [255, 255, 255]
  },
  {
    id: 'ninja',
    name: 'Ninja Xpress',
    code: 'NINJA',
    defaultLayanan: 'Standard',
    headerBg: [220, 20, 60],
    headerTextColor: [255, 255, 255]
  }
];

interface ResiData {
  courierId: string;
  namaPenerima: string;
  hpPenerima: string;
  alamatPenerima: string;
  jumlah: string;
  pembayaran: string; // 'cod' | 'nonCod'
  namaPengirim: string;
  hpPengirim: string;
  alamatPengirim: string;
  tanggal: string;
}

const DEFAULT_NAMA_PENGIRIM = "Kapuyuak Island";
const DEFAULT_HP_PENGIRIM = "+62 819-1100-8025";
const DEFAULT_ALAMAT_PENGIRIM = "JAWA BARAT, KOTA DEPOK, SUKMAJAYA, 16412, Perumahan Mutiara Buana, Jalan Lap Member Blok C2, No. C2, Sukmajaya";

export default function App() {
  const [mode, setMode] = useState<'manual' | 'massal' | null>(null);
  const [resiQueue, setResiQueue] = useState<ResiData[]>([]);

  // Setup / Config states (customizable on initial screen below courier)
  const [selectedCourierId, setSelectedCourierId] = useState('jnt');
  const [globalNamaPengirim, setGlobalNamaPengirim] = useState(DEFAULT_NAMA_PENGIRIM);
  const [globalHpPengirim, setGlobalHpPengirim] = useState(DEFAULT_HP_PENGIRIM);
  const [globalAlamatPengirim, setGlobalAlamatPengirim] = useState(DEFAULT_ALAMAT_PENGIRIM);

  // Form states (Receiver)
  const [namaPenerima, setNamaPenerima] = useState('');
  const [hpPenerima, setHpPenerima] = useState('');
  const [alamatPenerima, setAlamatPenerima] = useState('');
  const [jumlahPesanan, setJumlahPesanan] = useState('1');
  const [pembayaran, setPembayaran] = useState('cod');
  const [errorMsg, setErrorMsg] = useState('');

  const currentCourier = COURIERS.find(c => c.id === selectedCourierId) || COURIERS[0];

  const tanggalHariIni = () => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const resetForm = () => {
    setNamaPenerima('');
    setHpPenerima('');
    setAlamatPenerima('');
    setJumlahPesanan('1');
    setPembayaran('cod');
    setErrorMsg('');
  };

  const handleGantiMode = () => {
    setMode(null);
    setResiQueue([]);
    resetForm();
  };

  const ambilDataForm = (): ResiData | null => {
    const nama = namaPenerima.trim();
    const hp = hpPenerima.trim();
    const alamat = alamatPenerima.trim();
    const pengirim = globalNamaPengirim.trim();

    if (!nama) {
      setErrorMsg('Nama penerima wajib diisi.');
      return null;
    }
    if (!hp) {
      setErrorMsg('No. HP penerima wajib diisi.');
      return null;
    }
    if (!alamat) {
      setErrorMsg('Alamat lengkap wajib diisi.');
      return null;
    }
    if (!pengirim) {
      setErrorMsg('Nama pengirim wajib diisi.');
      return null;
    }

    setErrorMsg('');
    return {
      courierId: selectedCourierId,
      namaPenerima: nama,
      hpPenerima: hp,
      alamatPenerima: alamat,
      jumlah: jumlahPesanan,
      pembayaran,
      namaPengirim: globalNamaPengirim,
      hpPengirim: globalHpPengirim,
      alamatPengirim: globalAlamatPengirim,
      tanggal: tanggalHariIni()
    };
  };

  const centerText = (doc: jsPDF, text: string, x1: number, x2: number, y: number) => {
    const w = doc.getTextWidth(text);
    doc.text(text, x1 + (x2 - x1 - w) / 2, y);
  };

  const dashedLine = (doc: jsPDF, x1: number, y1: number, x2: number, y2: number, dash: number, gap: number) => {
    doc.setLineDashPattern([dash, gap], 0);
    doc.line(x1, y1, x2, y2);
    doc.setLineDashPattern([], 0);
  };

  const drawResiPage = (doc: jsPDF, data: ResiData, isFirstPage: boolean) => {
    if (!isFirstPage) {
      doc.addPage([100, 150], 'portrait');
    }

    const courier = COURIERS.find(c => c.id === data.courierId) || COURIERS[0];
    const pageWidth = 100;
    const marginX = 6;
    const contentWidth = pageWidth - marginX * 2;
    const labelPembayaran = data.pembayaran === 'cod' ? 'COD' : 'NON COD';

    // HEADER (Courier colored banner)
    const headerH = 18;
    doc.setFillColor(courier.headerBg[0], courier.headerBg[1], courier.headerBg[2]);
    doc.rect(0, 0, pageWidth, headerH, 'F');

    doc.setTextColor(courier.headerTextColor[0], courier.headerTextColor[1], courier.headerTextColor[2]);
    doc.setFont('helvetica', 'bold');
    
    const courierCode = courier.code;
    const fontSize = courierCode.length > 6 ? 15 : 19;
    doc.setFontSize(fontSize);
    doc.text(courierCode, marginX, 13);

    doc.setFontSize(8);
    doc.text('E X P R E S S', marginX + Math.max(20, courierCode.length * 4.2), 11.5);

    // COD / NON COD box
    const boxX2 = pageWidth - marginX;
    const boxX1 = boxX2 - 24;
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.rect(boxX1, 4.5, 24, 9.5);
    doc.setFontSize(10.5);
    centerText(doc, labelPembayaran, boxX1, boxX2, 11);

    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);

    let y = headerH + 7;

    // ============ PENERIMA ============
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text('PENERIMA', marginX, y);
    y += 2;
    doc.setLineWidth(0.3);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 5.5;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    const namaLines = doc.splitTextToSize(data.namaPenerima, contentWidth);
    doc.text(namaLines, marginX, y);
    y += namaLines.length * 5.5 + 1.5;

    doc.setFontSize(11.5);
    doc.text(data.hpPenerima, marginX, y);
    y += 5.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const alamatLines = doc.splitTextToSize(data.alamatPenerima, contentWidth);
    const printedAlamatLines = alamatLines.slice(0, 4);
    doc.text(printedAlamatLines, marginX, y);
    y += printedAlamatLines.length * 4 + 3;

    doc.setTextColor(0, 0, 0);
    dashedLine(doc, marginX, y, pageWidth - marginX, y, 1, 1);
    y += 5;

    // ============ FIELDS (2 columns) ============
    const colX1 = marginX;
    const colX2 = 53;
    const fieldsTop = y;

    const fieldPair = (label1: string, val1: string, label2: string, val2: string, yy: number) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(110, 110, 110);
      doc.text(label1, colX1, yy);
      doc.text(label2, colX2, yy);

      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(String(val1), colX1, yy + 5);
      doc.text(String(val2), colX2, yy + 5);
    };

    fieldPair('LAYANAN', courier.defaultLayanan, 'PEMBAYARAN', labelPembayaran, y);
    y += 11;
    fieldPair('TANGGAL', data.tanggal, 'EKSPEDISI', courier.name, y);
    y += 11;

    dashedLine(doc, colX2 - 3, fieldsTop - 2, colX2 - 3, y - 10, 0.6, 0.8);

    // ============ JUMLAH ============
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    doc.text('JUMLAH', colX1 + 6, y);
    y += 5.5;
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.text(`${data.jumlah} pcs`, colX1 + 6, y);
    y += 5;

    dashedLine(doc, marginX, y, pageWidth - marginX, y, 1, 1);
    y += 5;

    // ============ PENGIRIM ============
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text('PENGIRIM', marginX, y);
    y += 2;
    doc.setLineWidth(0.3);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 5.5;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    const namaPengirimLines = doc.splitTextToSize(data.namaPengirim, contentWidth);
    doc.text(namaPengirimLines, marginX, y);
    y += namaPengirimLines.length * 5 + 1.5;

    doc.setFontSize(10.5);
    doc.text(data.hpPengirim, marginX, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    const alamatPengirimLines = doc.splitTextToSize(data.alamatPengirim, contentWidth);
    const printedAlamatPengirim = alamatPengirimLines.slice(0, 3);
    doc.text(printedAlamatPengirim, marginX, y);

    // ============ FOOTER ============
    const footerH = 10;
    doc.setFillColor(courier.headerBg[0], courier.headerBg[1], courier.headerBg[2]);
    doc.rect(0, 150 - footerH, pageWidth, footerH, 'F');
    doc.setTextColor(courier.headerTextColor[0], courier.headerTextColor[1], courier.headerTextColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    centerText(doc, `${courier.name.toUpperCase()}  —  TERIMA KASIH`, marginX, pageWidth - marginX, 150 - footerH / 2 + 1.2);
  };

  const generatePdf = (list: ResiData[]) => {
    const doc = new jsPDF({ unit: 'mm', format: [100, 150], orientation: 'portrait' });
    list.forEach((data, idx) => {
      drawResiPage(doc, data, idx === 0);
    });
    const courier = COURIERS.find(c => c.id === list[0].courierId) || COURIERS[0];
    const fileName =
      list.length === 1
        ? `resi_${courier.id}_${sanitizeFileName(list[0].namaPenerima)}.pdf`
        : `resi_${courier.id}_${list.length}_pesanan_100x150mm.pdf`;
    doc.save(fileName);
  };

  const sanitizeFileName = (str: string) => {
    return str.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/, '').toLowerCase() || 'resi';
  };

  const handleDownloadManual = () => {
    const data = ambilDataForm();
    if (!data) return;
    generatePdf([data]);
  };

  const handleTambahResi = () => {
    const data = ambilDataForm();
    if (!data) return;
    setResiQueue([...resiQueue, data]);
    resetForm();
  };

  const handleSelesai = () => {
    if (resiQueue.length === 0) {
      setErrorMsg('Belum ada resi di antrean. Klik "Tambah Resi" terlebih dahulu, atau isi minimal satu resi.');
      return;
    }
    generatePdf(resiQueue);
    setResiQueue([]);
    resetForm();
  };

  const handleHapusAntrean = (idx: number) => {
    const updated = [...resiQueue];
    updated.splice(idx, 1);
    setResiQueue(updated);
  };

  return (
    <div className="max-w-[640px] mx-auto px-[18px] pt-[28px] pb-[80px]">
      <header className="flex items-baseline justify-between border-b-2 border-[#1a2e22] pb-[10px] mb-[22px]">
        <h1 className="text-[19px] tracking-[0.02em] font-bold m-0 flex items-center gap-2">
          <Truck size={22} className="text-[#c1481d]" /> Cetak Resi Ekspedisi
        </h1>
        <span className="font-mono text-[11px] text-[#6b7368]">100 &times; 150 mm / PDF</span>
      </header>

      {/* MODE SELECTION & GLOBAL CONFIG */}
      {mode === null && (
        <div className="bg-white border border-[#d8d2c2] rounded-[2px] p-[20px] mb-[16px]">
          <div className="mb-4">
            <label className="block text-[11.5px] font-semibold uppercase tracking-[0.03em] text-[#6b7368] mb-[6px]">
              Pilih Ekspedisi
            </label>
            <select
              value={selectedCourierId}
              onChange={(e) => setSelectedCourierId(e.target.value)}
              className="w-full p-[10px] border border-[#d8d2c2] rounded-[2px] text-[14px] font-semibold bg-white text-[#1a2e22] focus:outline-2 focus:outline-[#c1481d]"
            >
              {COURIERS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <hr className="border-none border-t border-dashed border-[#d8d2c2] my-[16px]" />

          <div className="mb-4">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#c1481d] tracking-[0.05em] mb-2 font-bold">
              <UserCheck size={14} /> Kostumisasi Pengirim (Default untuk Semua Resi)
            </div>

            <label className="block text-[11px] font-semibold uppercase tracking-[0.03em] text-[#6b7368] mb-[4px]">
              Nama Pengirim
            </label>
            <input
              type="text"
              value={globalNamaPengirim}
              onChange={(e) => setGlobalNamaPengirim(e.target.value)}
              placeholder="mis. Kapuyuak Island"
              className="w-full p-[9px_10px] border border-[#d8d2c2] rounded-[2px] text-[13.5px] bg-white text-[#1a2e22] focus:outline-2 focus:outline-[#c1481d] mb-3"
            />

            <label className="block text-[11px] font-semibold uppercase tracking-[0.03em] text-[#6b7368] mb-[4px]">
              No. HP Pengirim
            </label>
            <input
              type="text"
              value={globalHpPengirim}
              onChange={(e) => setGlobalHpPengirim(e.target.value)}
              placeholder="mis. +62 819-1100-8025"
              className="w-full p-[9px_10px] border border-[#d8d2c2] rounded-[2px] text-[13.5px] bg-white text-[#1a2e22] focus:outline-2 focus:outline-[#c1481d] mb-3"
            />

            <label className="block text-[11px] font-semibold uppercase tracking-[0.03em] text-[#6b7368] mb-[4px]">
              Alamat Pengirim
            </label>
            <textarea
              value={globalAlamatPengirim}
              onChange={(e) => setGlobalAlamatPengirim(e.target.value)}
              placeholder="Alamat lengkap pengirim"
              className="w-full p-[9px_10px] border border-[#d8d2c2] rounded-[2px] text-[13.5px] bg-white text-[#1a2e22] focus:outline-2 focus:outline-[#c1481d] resize-vertical min-h-[50px]"
            />
          </div>

          <hr className="border-none border-t border-dashed border-[#d8d2c2] my-[16px]" />

          <div className="grid grid-cols-2 gap-[12px]">
            <button
              onClick={() => setMode('manual')}
              className="text-left p-[16px] border border-[#1a2e22] bg-white rounded-[2px] cursor-pointer hover:bg-[#fbf2ec] hover:border-[#c1481d] transition-colors"
            >
              <span className="font-mono text-[11px] text-[#c1481d] block mb-[6px]">Opsi 1</span>
              <span className="font-bold text-[14.5px] block mb-[4px]">Input Manual</span>
              <span className="text-[12px] text-[#6b7368] block">Buat satu resi langsung, lalu unduh PDF.</span>
            </button>
            <button
              onClick={() => setMode('massal')}
              className="text-left p-[16px] border border-[#1a2e22] bg-white rounded-[2px] cursor-pointer hover:bg-[#fbf2ec] hover:border-[#c1481d] transition-colors"
            >
              <span className="font-mono text-[11px] text-[#c1481d] block mb-[6px]">Opsi 2</span>
              <span className="font-bold text-[14.5px] block mb-[4px]">Input Massal</span>
              <span className="text-[12px] text-[#6b7368] block">Tambahkan beberapa resi berurutan, unduh sekaligus jadi satu PDF.</span>
            </button>
          </div>
        </div>
      )}

      {/* FORM (Receiver details only, sender is pre-configured above) */}
      {mode !== null && (
        <div className="bg-white border border-[#d8d2c2] rounded-[2px] p-[20px] mb-[16px]">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={handleGantiMode}
              className="bg-none border-none text-[#6b7368] underline cursor-pointer text-[12.5px] p-0 font-inherit flex items-center gap-1 hover:text-[#c1481d]"
            >
              <ArrowLeft size={14} /> Ganti mode &amp; ekspedisi / pengirim
            </button>
            <div className="flex gap-2">
              <span className="font-mono text-[11px] bg-[#f1efe7] px-2 py-1 rounded font-semibold text-[#1a2e22]">
                {currentCourier.name}
              </span>
              <span className="font-mono text-[11px] bg-[#f1efe7] px-2 py-1 rounded text-[#6b7368]">
                Pengirim: {globalNamaPengirim}
              </span>
            </div>
          </div>

          <div className="font-mono text-[11px] text-[#c1481d] tracking-[0.05em] mt-[4px]">Penerima</div>
          
          <label className="block text-[11.5px] font-semibold uppercase tracking-[0.03em] text-[#6b7368] mt-[14px] mb-[5px]">
            Nama Penerima
          </label>
          <input
            type="text"
            value={namaPenerima}
            onChange={(e) => setNamaPenerima(e.target.value)}
            placeholder="mis. Yuli / Mitra (Yuli)"
            className="w-full p-[9px_10px] border border-[#d8d2c2] rounded-[2px] text-[14px] bg-white text-[#1a2e22] focus:outline-2 focus:outline-[#c1481d] focus:border-[#c1481d]"
          />

          <label className="block text-[11.5px] font-semibold uppercase tracking-[0.03em] text-[#6b7368] mt-[14px] mb-[5px]">
            No. HP Penerima
          </label>
          <input
            type="tel"
            value={hpPenerima}
            onChange={(e) => setHpPenerima(e.target.value)}
            placeholder="mis. 0858-1532-5512"
            className="w-full p-[9px_10px] border border-[#d8d2c2] rounded-[2px] text-[14px] bg-white text-[#1a2e22] focus:outline-2 focus:outline-[#c1481d] focus:border-[#c1481d]"
          />

          <label className="block text-[11.5px] font-semibold uppercase tracking-[0.03em] text-[#6b7368] mt-[14px] mb-[5px]">
            Alamat Lengkap
          </label>
          <textarea
            value={alamatPenerima}
            onChange={(e) => setAlamatPenerima(e.target.value)}
            placeholder="Jalan, RT/RW, kelurahan, kecamatan, kota/kab, provinsi, kode pos"
            className="w-full p-[9px_10px] border border-[#d8d2c2] rounded-[2px] text-[14px] bg-white text-[#1a2e22] focus:outline-2 focus:outline-[#c1481d] focus:border-[#c1481d] resize-vertical min-h-[60px]"
          />

          <div className="grid grid-cols-2 gap-[12px]">
            <div>
              <label className="block text-[11.5px] font-semibold uppercase tracking-[0.03em] text-[#6b7368] mt-[14px] mb-[5px]">
                Jumlah Pesanan
              </label>
              <select
                value={jumlahPesanan}
                onChange={(e) => setJumlahPesanan(e.target.value)}
                className="w-full p-[9px_10px] border border-[#d8d2c2] rounded-[2px] text-[14px] bg-white text-[#1a2e22] focus:outline-2 focus:outline-[#c1481d] focus:border-[#c1481d]"
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} pcs
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold uppercase tracking-[0.03em] text-[#6b7368] mt-[14px] mb-[5px]">
                Pembayaran
              </label>
              <select
                value={pembayaran}
                onChange={(e) => setPembayaran(e.target.value)}
                className="w-full p-[9px_10px] border border-[#d8d2c2] rounded-[2px] text-[14px] bg-white text-[#1a2e22] focus:outline-2 focus:outline-[#c1481d] focus:border-[#c1481d]"
              >
                <option value="cod">COD</option>
                <option value="nonCod">Non COD</option>
              </select>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-[#fbe9e4] border border-[#e0a691] text-[#8a3418] p-[9px_12px] rounded-[2px] text-[13px] mt-[12px]">
              {errorMsg}
            </div>
          )}

          {/* Manual actions */}
          {mode === 'manual' && (
            <div className="flex gap-[10px] mt-[20px] flex-wrap">
              <button
                onClick={handleDownloadManual}
                className="bg-[#1a2e22] text-white border-none px-[18px] py-[11px] rounded-[2px] text-[13.5px] font-semibold cursor-pointer hover:bg-[#c1481d] transition-colors flex items-center gap-2"
              >
                <Download size={16} /> Download PDF ({currentCourier.name})
              </button>
            </div>
          )}

          {/* Bulk actions */}
          {mode === 'massal' && (
            <div className="flex gap-[10px] mt-[20px] flex-wrap">
              <button
                onClick={handleTambahResi}
                className="bg-white text-[#1a2e22] border border-[#1a2e22] px-[18px] py-[11px] rounded-[2px] text-[13.5px] font-semibold cursor-pointer hover:border-[#c1481d] hover:text-[#c1481d] transition-colors flex items-center gap-2"
              >
                <Plus size={16} /> Tambah Resi
              </button>
              <button
                onClick={handleSelesai}
                className="bg-[#1a2e22] text-white border-none px-[18px] py-[11px] rounded-[2px] text-[13.5px] font-semibold cursor-pointer hover:bg-[#c1481d] transition-colors flex items-center gap-2"
              >
                <Printer size={16} /> Selesai &amp; Download PDF ({resiQueue.length} Resi)
              </button>
            </div>
          )}

          {/* Queue Panel */}
          {mode === 'massal' && (
            <div className="mt-[16px]">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.03em] text-[#6b7368] mb-[10px]">
                Antrean Resi ({currentCourier.name})
              </h2>
              {resiQueue.length === 0 ? (
                <p className="text-[12.5px] text-[#6b7368]">Belum ada resi ditambahkan.</p>
              ) : (
                <div className="space-y-2">
                  {resiQueue.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-[9px] border-b border-[#d8d2c2] text-[13.5px]"
                    >
                      <div>
                        <div className="font-semibold">
                          {idx + 1}. {item.namaPenerima}
                        </div>
                        <div className="text-[#6b7368] text-[12px]">
                          {item.jumlah} pcs &middot; {item.pembayaran === 'cod' ? 'COD' : 'Non COD'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleHapusAntrean(idx)}
                        className="bg-none border-none text-[#a33] cursor-pointer text-[12px] underline flex items-center gap-1"
                      >
                        <Trash2 size={13} /> Hapus
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <footer className="text-center text-[11.5px] text-[#6b7368] mt-[36px]">
        Dibuat untuk pencetakan resi ekspedisi &middot; format 100&times;150mm
      </footer>
    </div>
  );
}
