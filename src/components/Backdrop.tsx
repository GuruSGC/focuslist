/**
 * Static ukiyo-e style painting behind the whole app: dawn sky, sun, Fuji, layered waves with
 * foam claws and woodblock line work, a pine branch, and a band of seigaiha wave pattern.
 * Original vector artwork. Decorative only. A mask (see .backdrop-art) fades it into the papyrus
 * so the app area stays clean paper.
 */
const OUTLINE = { stroke: 'var(--sumi)', strokeOpacity: 0.55, strokeWidth: 2.5, strokeLinejoin: 'round' } as const
const HATCH = { fill: 'none', strokeLinecap: 'round', strokeWidth: 2.5 } as const

/** Pine needles: a fan of short strokes around a point, angled by `heading` degrees. */
function needleFan(x: number, y: number, heading: number, length: number): string {
  return [-56, -28, 0, 28, 56]
    .map((spread) => {
      const angle = ((heading + spread) * Math.PI) / 180
      return `M${x} ${y}l${Math.round(Math.cos(angle) * length)} ${Math.round(Math.sin(angle) * length)}`
    })
    .join('')
}

const TUFTS: [number, number, number, number][] = [
  [1450, 238, 100, 46],
  [1360, 284, 110, 44],
  [1250, 302, 120, 48],
  [1335, 246, 60, 40],
  [1525, 178, 80, 42],
  [1410, 204, 70, 40],
  [1500, 214, 130, 38],
]

export function Backdrop() {
  return (
    <div className="layer-fixed z-0 overflow-hidden" aria-hidden="true" data-testid="painting-backdrop" data-motif="painting">
      <div className="backdrop-art">
        <svg className="absolute inset-0 size-full" viewBox="0 0 1600 900" preserveAspectRatio="xMaxYMax slice" focusable="false">
          <defs>
            <pattern id="seigaiha" width="64" height="32" patternUnits="userSpaceOnUse">
              <g fill="none" stroke="var(--p-wave-mid)" strokeWidth="1.6">
                <circle cx="32" cy="32" r="30" />
                <circle cx="32" cy="32" r="22" />
                <circle cx="32" cy="32" r="14" />
                <circle cx="0" cy="16" r="30" />
                <circle cx="0" cy="16" r="22" />
                <circle cx="0" cy="16" r="14" />
                <circle cx="64" cy="16" r="30" />
                <circle cx="64" cy="16" r="22" />
                <circle cx="64" cy="16" r="14" />
              </g>
            </pattern>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--p-sky)" />
              <stop offset="0.7" stopColor="var(--p-sky)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="bokashi" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--p-wave-deep)" />
              <stop offset="0.65" stopColor="var(--p-wave-deep)" />
              <stop offset="1" stopColor="var(--p-wave-mid)" />
            </linearGradient>
            <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--paper)" stopOpacity="0" />
              <stop offset="1" stopColor="var(--paper)" stopOpacity="0.7" />
            </linearGradient>
          </defs>

          <rect width="1600" height="900" fill="url(#sky)" />

          <g data-motif="sun">
            <circle cx="1400" cy="250" r="138" fill="var(--p-sun)" opacity="0.18" />
            <circle cx="1400" cy="250" r="112" fill="var(--p-sun)" />
          </g>

          <g data-motif="fuji">
            <path
              d="M900 700C1010 640 1110 520 1190 420C1225 376 1256 352 1290 352C1324 352 1355 376 1390 420C1470 520 1570 640 1700 700Z"
              fill="var(--p-fuji)"
              {...OUTLINE}
              strokeOpacity={0.35}
            />
            <path
              d="M1190 420C1225 376 1256 352 1290 352C1324 352 1355 376 1390 420L1368 432L1344 412L1318 442L1290 414L1262 444L1238 418L1214 436Z"
              fill="var(--p-snow)"
            />
            <rect x="880" y="600" width="840" height="110" fill="url(#mist)" />
          </g>

          <g data-motif="pine" stroke="var(--p-branch)" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.9">
            <path d="M1610 128C1520 148 1440 190 1370 215C1320 232 1280 262 1240 300" strokeWidth="8" />
            <path d="M1500 160C1490 190 1470 215 1450 238" strokeWidth="5" />
            <path d="M1400 205C1395 240 1380 262 1360 284" strokeWidth="5" />
            <path d="M1440 196C1410 208 1380 226 1335 246" strokeWidth="4" />
            <path d={TUFTS.map(([x, y, heading, length]) => needleFan(x, y, heading, length)).join('')} strokeWidth="2.6" />
          </g>

          <g data-motif="seigaiha" opacity="0.5">
            <rect x="0" y="724" width="1000" height="176" fill="url(#seigaiha)" />
          </g>

          <g data-motif="wave">
            <path
              d="M560 900V800C640 780 720 740 800 720C900 695 980 705 1060 680C1160 650 1240 660 1340 630C1440 600 1520 620 1640 590V900Z"
              fill="var(--p-wave-light)"
            />
            <path
              d="M600 900C600 810 660 740 740 690C820 640 900 570 990 500C1070 440 1190 415 1270 465C1335 505 1330 585 1270 610C1235 624 1195 612 1188 580C1215 592 1248 580 1250 552C1252 522 1215 500 1175 512C1115 530 1085 590 1105 650C1128 718 1210 752 1330 752L1640 752V900Z"
              fill="url(#bokashi)"
              {...OUTLINE}
            />
            <g stroke="var(--p-wave-mid)" opacity="0.85" {...HATCH}>
              <path d="M660 860C700 800 770 760 850 720C930 680 1000 620 1060 570" />
              <path d="M700 880C750 820 820 780 900 740C980 700 1030 650 1085 600" />
              <path d="M760 890C810 840 880 800 950 765C1020 730 1060 690 1100 650" />
              <path d="M640 820C680 770 740 735 800 700" />
              <path d="M1120 700C1150 730 1200 745 1260 748" />
            </g>
            <path
              d="M700 900C720 840 780 800 860 780C940 760 1000 730 1050 690C1010 760 1060 800 1140 810C1220 820 1300 800 1400 820C1480 836 1560 830 1640 850V900Z"
              fill="var(--p-wave-mid)"
              {...OUTLINE}
              strokeOpacity={0.4}
            />
            <g fill="var(--p-foam)" {...OUTLINE} strokeWidth={2}>
              <path d="M1270 610C1290 625 1292 648 1276 664C1270 646 1262 630 1248 618Z" />
              <path d="M1236 626C1252 642 1250 664 1234 676C1230 658 1224 642 1212 630Z" />
              <path d="M1300 588C1322 596 1332 618 1322 636C1312 622 1302 608 1290 600Z" />
              <path d="M1010 500C1090 445 1190 425 1262 470C1210 452 1130 470 1070 520C1050 536 1030 546 1010 552Z" />
            </g>
            <g fill="var(--p-foam)">
              <circle cx="1350" cy="662" r="7" />
              <circle cx="1378" cy="640" r="5" />
              <circle cx="1332" cy="688" r="5" />
              <circle cx="1395" cy="676" r="4" />
              <circle cx="1420" cy="652" r="3" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  )
}
