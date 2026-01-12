<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Surat Keterangan Lolos</title>
    <style>
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12pt;
        }
        .header {
            width: 100%;
            border-bottom: 2px solid #888;
            margin-bottom: 10px;
        }
        .header-table {
            width: 100%;
        }
        .header-table td {
            vertical-align: top;
        }
        .logo {
            width: 100px;
            height: 100px;
            background: #eee;
            display: inline-block;
        }
        .center-text {
            text-align: center;
        }
        .right-text {
            text-align: right;
        }
        .bold {
            font-weight: bold;
        }
        .underline {
            text-decoration: underline;
        }
        .mt-2 {
            margin-top: 1em;
        }
        .mt-4 {
            margin-top: 2em;
        }
        .mb-2 {
            margin-bottom: 1em;
        }
        .mb-4 {
            margin-bottom: 2em;
        }
        .indent {
            text-indent: 2em;
        }
        .signature {
            margin-top: 3em;
            text-align: right;
        }
        .red-underline {
            color: #000;
            text-decoration: underline red wavy;
        }
    </style>
</head>
<body>
    <div class="header">
        <table class="header-table">
            <tr>
                <td style="width: 120px;">
                    <!-- Left Logo Placeholder -->
                    <div class="logo"></div>
                </td>
                <td class="center-text">
                    <div class="bold">PROGRAM STUDI EKONOMI PEMBANGUNAN</div>
                    <div class="bold">FAKULTAS EKONOMI DAN BISNIS</div>
                    <div class="bold">UNIVERSITAS MUHAMMADIYAH MALANG</div>
                    <div>Jl. Raya Tlogomas 246 Telp. (0341) 464318 ext. 215 Fax. (0341) 460435 Malang 65144</div>
                </td>
                <td style="width: 120px; text-align: right;">
                    <!-- Right Logo Placeholder -->
                    <div class="logo"></div>
                </td>
            </tr>
        </table>
    </div>
    <div class="right-text mb-2">
        @php
            $possibleMonths = [
                '01' => 'Januari',
                '02' => 'Februari',
                '03' => 'Maret',
                '04' => 'April',
                '05' => 'Mei',
                '06' => 'Juni',
                '07' => 'Juli',
                '08' => 'Agustus',
                '09' => 'September',
                '10' => 'Oktober',
                '11' => 'November',
                '12' => 'Desember',
            ];
        @endphp
        Malang, {{ date('d') }} {{ $possibleMonths[date('m')] }} {{ date('Y') }}
    </div>
    <div class="mb-2">
        Kepada Yth.<br>
        Sdr.<br>
        <span class="bold underline">{{ $userTicket->user->name }}</span>
    </div>
    <div class="mb-2">
        Assalamu`alaikum wr. wb.<br>
        Terimakasih kami ucapkan atas kepercayaan Bapak/Ibu mengirimkan manuskrip yang berjudul:
    </div>
    <div class="center-text bold mb-2" style="text-decoration: underline red wavy;">
        {{ $userTicket->userTicketDetail->article_title }}
    </div>
    <div class="mb-2">
        Sesuai dengan prosedur baku di <span class="red-underline">Jurnal Ilmu Ekonomi</span> manuskrip tersebut telah kami kirimkan kepada editor ahli kami sesuai dengan topik yang diajukan untuk dilakukan <i>blind review</i>. Berdasarkan hasil <i>blind review</i> tersebut, dengan ini kami sampaikan bahwa menuskirp tersebut dinyatakan:
    </div>
    <div class="center-text bold mb-2">
        LOLOS
    </div>
    <div class="mb-2">
        Artikel tersebut diatas <span class="red-underline">memenuhi syarat</span> akan dipublikasikan secara online di Jurnal Ilmu Ekonomi (JIE).
    </div>
    <div class="mb-2">
        Demikian, kiranya dapat dimaklumi.<br>
        Wassalamu`alaikum wr. wb.
    </div>
    <div class="signature">
        Instruktur Penulisan Artikel Ilmiah<br><br><br>
        M. Khoirul Fuddin, S.E., M.E.
    </div>
</body>
</html>
