# Board Arrow Indicator — Brief

## Overview
Interactive directional arrow rendered on the chessboard to guide the user toward the correct move. Inspired by Lichess annotation arrows but repurposed as a subtle learning hint.

## Parameters

### Color
- **Value:** `rgba(44, 36, 27, 0.45)`
- **Rationale:** Dark brown from the board overlay palette, 45% opacity. Consciously neutral — does not compete with the wooden board. Reads well on both light and dark squares.

### Thickness
- **Value:** `14px` (mobile + desktop)

### Shape
- **Value:** Vertical line with fully rounded ends (`strokeLinecap="round"`) + arrowhead triangle at destination
- **Reference:** Lichess annotation arrows

### Position
- **Value:** Computed dynamically from white piece to first star (`guideArrows` prop `{ from: string; to: string }[]`)
- **Auto-generation:** If `guideArrows` not explicitly set in level data, arrow is auto-generated from first white piece matching `pieceType` to `stars[0]`

### Z-index
- **Value:** Above board squares (`z-20`), below pieces (`z-25`)

### Animation
- **On mount:** `arrowFadeIn` — opacity 0→1 + scaleY 0.8→1, 0.4s ease-out
- **Idle:** `arrowIdlePulse` — opacity oscillates 0.45 → 0.55 → 0.45, 2s ease-in-out infinite

### Disappearance
- **Trigger:** After user's correct move (when `selectedSquare` or `dragPiece` is active)
- **Implementation:** Conditional render `{guideArrows.length > 0 && !selectedSquare && !dragPiece && (...)}`

## Files Modified
- `src/components/LessonClient.tsx` — arrow SVG: color, strokeWidth logic, z-20, className, auto-generation useMemo
- `src/app/globals.css` — keyframes `arrowFadeIn`, `arrowIdlePulse`; `.arrow-hint-line` class

## Deployment
- URL: https://chess-course-platform-designer.vercel.app
