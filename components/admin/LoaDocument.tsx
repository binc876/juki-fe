import React from 'react';

interface LoaDocumentProps {
  name: string;
  articleTitle: string;
  date: string; // e.g. "12 Januari 2026"
  style?: React.CSSProperties;
}

export const LoaDocument = React.forwardRef<HTMLDivElement, LoaDocumentProps>(
  ({ name, articleTitle, date, style }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '25mm',
          backgroundColor: 'white',
          color: 'black',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '12pt',
          lineHeight: '1.5',
          position: 'relative',
          boxSizing: 'border-box',
          ...style
        }}
      >
        {/* HEADER TABLE - Matches Blade Template */}
        <div style={{ borderBottom: '2px solid #000', marginBottom: '20px', paddingBottom: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: '180px', verticalAlign: 'middle' }}>
                  {/* Left Logo */}
                  <div style={{ width: '180px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                    <img 
                      src="/logo-umm.png" 
                      alt="Logo UMM" 
                      style={{ width: '100%', height: 'auto', display: 'block' }} 
                    />
                  </div>
                </td>
                <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '0 10px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14pt', textTransform: 'uppercase' }}>PROGRAM STUDI EKONOMI PEMBANGUNAN</div>
                  <div style={{ fontWeight: 'bold', fontSize: '14pt', textTransform: 'uppercase' }}>FAKULTAS EKONOMI DAN BISNIS</div>
                  <div style={{ fontWeight: 'bold', fontSize: '14pt', textTransform: 'uppercase' }}>UNIVERSITAS MUHAMMADIYAH MALANG</div>
                  <div style={{ fontSize: '10pt', marginTop: '5px' }}>Jl. Raya Tlogomas 246 Telp. (0341) 464318 ext. 215 Fax. (0341) 460435 Malang 65144</div>
                </td>
                <td style={{ width: '180px', verticalAlign: 'top', textAlign: 'right' }}>
                  {/* Right Logo Placeholder for Balance */}
                  <div style={{ width: '180px', opacity: 0 }}></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* DATE */}
        <div style={{ textAlign: 'right', marginBottom: '20px' }}>
          Malang, {date}
        </div>

        {/* RECIPIENT */}
        <div style={{ marginBottom: '20px' }}>
          Kepada Yth.<br />
          Sdr.<br />
          <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{name}</span>
        </div>

        {/* SALUTATION */}
        <div style={{ marginBottom: '20px' }}>
          Assalamu`alaikum wr. wb.<br />
          Terimakasih kami ucapkan atas kepercayaan Bapak/Ibu mengirimkan manuskrip yang berjudul:
        </div>

        {/* ARTICLE TITLE */}
        <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '20px', padding: '0 20px' }}>
          <span style={{ borderBottom: '1.5px solid red' }}>
            "{articleTitle}"
          </span>
        </div>

        {/* BODY TEXT */}
        <div style={{ marginBottom: '20px', textAlign: 'justify' }}>
          Sesuai dengan prosedur baku di <span style={{ fontWeight: 'bold', borderBottom: '1.5px solid red' }}>Jurnal Ilmu Ekonomi</span> manuskrip tersebut telah kami kirimkan kepada editor ahli kami sesuai dengan topik yang diajukan untuk dilakukan <i>blind review</i>. Berdasarkan hasil <i>blind review</i> tersebut, dengan ini kami sampaikan bahwa manuskrip tersebut dinyatakan:
        </div>

        {/* RESULT */}
        <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '20px', fontSize: '14pt' }}>
          LOLOS
        </div>

        {/* CONCLUSION */}
        <div style={{ marginBottom: '20px', textAlign: 'justify' }}>
          Artikel tersebut diatas <span style={{ fontWeight: 'bold', borderBottom: '1.5px solid red' }}>memenuhi syarat</span> akan dipublikasikan secara online di Jurnal Ilmu Ekonomi (JIE).
        </div>

        {/* CLOSING */}
        <div style={{ marginBottom: '40px' }}>
          Demikian, kiranya dapat dimaklumi.<br />
          Wassalamu`alaikum wr. wb.
        </div>

        {/* SIGNATURE */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'inline-block', textAlign: 'left', minWidth: '250px' }}>
            Instruktur Penulisan Artikel Ilmiah<br />
            <br /><br /><br /><br />
            <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
              M. Khoirul Fuddin, S.E., M.E.
            </span>
          </div>
        </div>
      </div>
    );
  }
);

LoaDocument.displayName = 'LoaDocument';
