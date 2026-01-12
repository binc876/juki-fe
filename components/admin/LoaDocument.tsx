import React from 'react';

interface LoaDocumentProps {
  name: string;
  articleTitle: string;
  date: string; // e.g. "26 Februari 2025"
  ojsLink?: string;
  style?: React.CSSProperties;
}

export const LoaDocument = React.forwardRef<HTMLDivElement, LoaDocumentProps>(
  ({ name, articleTitle, date, ojsLink, style }, ref) => {
    return (
      <div
        ref={ref}
        className="document-root"
        style={{
          backgroundColor: 'white',
          color: 'black',
          fontFamily: '"Times New Roman", Times, serif',
          ...style
        }}
      >
        {/* SINGLE PAGE LOA */}
        <div
          style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '20mm 25mm 30mm 25mm',
            position: 'relative',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* WATERMARK */}
          <div 
            className="watermark-container"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-45deg)',
              opacity: 0.08,
              zIndex: 0,
              pointerEvents: 'none',
              width: '120mm',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <img 
              src="/Logo_UMM.png" 
              alt="Watermark" 
              style={{ width: '100%', height: 'auto' }} 
            />
          </div>

          <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
            {/* HEADER - Flexbox for better compatibility */}
            <div style={{ 
              borderBottom: '4px double #000', 
              marginBottom: '25px', 
              paddingBottom: '10px',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '5px'
            }}>
              {/* Left Logo */}
              <div style={{ width: '140px', flexShrink: 0 }}>
                <img 
                  src="/Logo_UMM.png" 
                  alt="Logo UMM" 
                  style={{ width: '100%', height: 'auto', display: 'block' }} 
                />
              </div>

              {/* Center Text */}
              <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
                <div style={{ fontWeight: 'bold', fontSize: '11pt', color: '#000', lineHeight: '1.1' }}>
                  PROGRAM STUDI EKONOMI PEMBANGUNAN
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '11pt', color: '#000', lineHeight: '1.1' }}>
                  FAKULTAS EKONOMI DAN BISNIS
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '11pt', color: '#000', lineHeight: '1.1' }}>
                  UNIVERSITAS MUHAMMADIYAH MALANG
                </div>
                <div style={{ fontSize: '8pt', color: '#000', marginTop: '4px', whiteSpace: 'nowrap', lineHeight: '1.1' }}>
                  Jl. Raya Tlogomas 246 Telp. (0341) 464318 ext. 215 Fax. (0341) 460435 Malang 65144
                </div>
              </div>

              {/* Right Logo */}
              <div style={{ width: '140px', flexShrink: 0, textAlign: 'right' }}>
                <img 
                  src="/Logo_EP.png" 
                  alt="Logo EP" 
                  style={{ width: '100%', height: 'auto', display: 'block', marginLeft: 'auto' }} 
                />
              </div>
            </div>

            {/* DATE */}
            <div style={{ textAlign: 'right', marginBottom: '25px', fontSize: '12pt' }}>
              Malang, {date}
            </div>

            {/* RECIPIENT */}
            <div style={{ marginBottom: '25px', fontSize: '12pt' }}>
              Kepada Yth.<br />
              Sdr.<br />
              <span style={{ fontWeight: 'bold' }}>{name}</span>
            </div>

            {/* SALUTATION */}
            <div style={{ marginBottom: '15px', fontSize: '12pt', textAlign: 'justify' }}>
              Assalamu`alaikum wr. wb.
            </div>
            
            <div style={{ marginBottom: '20px', fontSize: '12pt', textAlign: 'justify' }}>
              Terimakasih kami ucapkan atas kepercayaan Bapak/Ibu mengirimkan manuskrip yang berjudul:
            </div>

            {/* ARTICLE TITLE */}
            <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '20px', fontSize: '12pt', padding: '0 20px' }}>
              <span>{articleTitle}</span>
            </div>

            {/* BODY TEXT */}
            <div style={{ marginBottom: '20px', textAlign: 'justify', fontSize: '12pt' }}>
              Sesuai dengan prosedur baku di <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Jurnal Ilmu Ekonomi</span> manuskrip tersebut telah kami kirimkan kepada editor ahli kami sesuai dengan topik yang diajukan untuk dilakukan <i>blind review.</i> Berdasarkan hasil <i>blind review</i> tersebut, dengan ini kami sampaikan bahwa manuskrip tersebut dinyatakan:
            </div>

            {/* RESULT */}
            <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '25px', fontSize: '16pt' }}>
              LOLOS
            </div>

            {/* CONCLUSION */}
            <div style={{ marginBottom: '20px', textAlign: 'justify', fontSize: '12pt' }}>
              Artikel tersebut di atas <span style={{ fontWeight: 'bold' }}>memenuhi syarat</span> akan dipublikasikan secara online di Jurnal Ilmu Ekonomi (JIE).
            </div>

            {/* CLOSING */}
            <div style={{ marginBottom: '15px', fontSize: '12pt', textAlign: 'justify' }}>
              Demikian, kiranya dapat dimaklumi.
            </div>
            
            <div style={{ marginBottom: '40px', fontSize: '12pt' }}>
              Wassalamu`alaikum wr. wb.
            </div>

            {/* SIGNATURE */}
            <div style={{ textAlign: 'right', marginBottom: '30px' }}>
              <div style={{ display: 'inline-block', textAlign: 'left', minWidth: '250px', fontSize: '12pt' }}>
                Instruktur Penulisan Artikel Ilmiah<br />
                <br /><br /><br /><br />
                <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
                  M. Khoirul Fuddin, S.E., M.E.
                </span>
              </div>
            </div>
          </div>

          {/* FOOTER - Updated with class for PDF identification */}
          <div style={{ borderTop: '1px solid #ccc', pt: '10px', fontSize: '10pt', position: 'relative', zIndex: 1 }}>
            <div style={{ fontWeight: 'bold', color: '#1a4a7c' }}>
              {ojsLink ? (
                <a 
                  href={ojsLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="footer-link"
                  style={{ color: '#1a4a7c', textDecoration: 'underline', textTransform: 'uppercase' }}
                >
                  JOURNAL OF ECONOMIC AND SOCIAL EMPOWERMENT
                </a>
              ) : (
                <span style={{ textTransform: 'uppercase' }}>JOURNAL OF ECONOMIC AND SOCIAL EMPOWERMENT</span>
              )}
            </div>
            <div style={{ color: '#666', fontStyle: 'italic', marginTop: '2px' }}>
              Journal of Economic and Social Empowerment
            </div>
          </div>
        </div>
      </div>
    );
  }
);

LoaDocument.displayName = 'LoaDocument';