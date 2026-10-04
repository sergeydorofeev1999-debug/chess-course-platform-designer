'use client';

interface OpeningArrow {
  from: string;
  to: string;
  color?: 'green' | 'red';
}

interface Props {
  arrows: OpeningArrow[];
  sqSize: number;
  isReversed?: boolean;
  inset?: number;
  zIndex?: number;
  greenColor?: string;
  greenOpacity?: number;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

/** Lichess-style board arrows: same silhouette as the lesson hint arrow, colored for opening guidance. */
export default function OpeningArrowsOverlay({ arrows, sqSize, isReversed = false, inset = 0, zIndex = 30, greenColor = '#4A7A3A', greenOpacity = 0.35 }: Props) {
  if (arrows.length === 0) return null;
  const files = isReversed ? [...FILES].reverse() : FILES;
  const ranks = isReversed ? [...RANKS].reverse() : RANKS;

  return (
    <svg
      aria-hidden="true"
      className="absolute pointer-events-none"
      style={{ top: inset, left: inset, width: 8 * sqSize, height: 8 * sqSize, zIndex }}
      viewBox={`0 0 ${8 * sqSize} ${8 * sqSize}`}
    >
      {arrows.map((arrow, index) => {
        const fromF = files.indexOf(arrow.from[0]);
        const fromR = ranks.indexOf(arrow.from[1]);
        const toF = files.indexOf(arrow.to[0]);
        const toR = ranks.indexOf(arrow.to[1]);
        if (fromF < 0 || fromR < 0 || toF < 0 || toR < 0) return null;

        const x1 = (fromF + 0.5) * sqSize;
        const y1 = (fromR + 0.5) * sqSize;
        const x2 = (toF + 0.5) * sqSize;
        const y2 = (toR + 0.5) * sqSize;
        const strokeW = sqSize < 60 ? 14 : 18;
        const halfW = strokeW / 2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const headHeight = Math.min(sqSize * 0.6, len * 0.42);
        const headBase = strokeW * 3;
        const arrowTipPadding = Math.min(sqSize * 0.34, len * 0.28);
        const endX = x2 - (dx / len) * arrowTipPadding;
        const endY = y2 - (dy / len) * arrowTipPadding;
        const nx = -dy / len;
        const ny = dx / len;
        const blx = x1 + nx * halfW;
        const bly = y1 + ny * halfW;
        const brx = x1 - nx * halfW;
        const bry = y1 - ny * halfW;
        const tailX = endX - (dx / len) * headHeight;
        const tailY = endY - (dy / len) * headHeight;
        const tlx = tailX + nx * halfW;
        const tly = tailY + ny * halfW;
        const trx = tailX - nx * halfW;
        const try_ = tailY - ny * halfW;
        const hlx = tailX + (nx * headBase) / 2;
        const hly = tailY + (ny * headBase) / 2;
        const hrx = tailX - (nx * headBase) / 2;
        const hry = tailY - (ny * headBase) / 2;
        const cross = (brx - blx) * (-dy / len) - (bry - bly) * (-dx / len);
        const sweep = cross > 0 ? 1 : 0;
        const pathD = `M ${blx} ${bly} L ${tlx} ${tly} L ${hlx} ${hly} L ${endX} ${endY} L ${hrx} ${hry} L ${trx} ${try_} L ${brx} ${bry} A ${halfW} ${halfW} 0 1 ${sweep} ${blx} ${bly} Z`;
        const isThreat = arrow.color === 'red';

        return (
          <path
            key={`${arrow.from}-${arrow.to}-${index}`}
            d={pathD}
            fill={isThreat ? '#A63838' : greenColor}
            fillOpacity={isThreat ? 0.7 : greenOpacity}
          />
        );
      })}
    </svg>
  );
}
