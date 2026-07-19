# Board Arrow Indicator — Brief

## Overview
Interactive directional arrow rendered on the chessboard to guide the user toward the correct move. Inspired by Lichess annotation arrows but repurposed as a subtle learning hint.

## Parameters

### Color
- **Value:** `rgba(232, 168, 56, 0.60)`
- **Rationale:** Warm gold, 60% opacity. Reads well on both light and dark squares. Associates with "hint/direction" rather than neutral annotation.

### Thickness
- **Mobile:** `14px`
- **Desktop:** `18px`

### Shape
- **Value:** Vertical line with fully rounded ends (`strokeLinecap="round"`)
- **Reference:** Lichess annotation arrows

### Position
- **Value:** Center of d-file, from center of d2 to center of d7
- **Dynamic:** Computed from `guideArrows` prop `{ from: string, to: string }[]`

### Z-index
- **Value:** Above board squares (`z-20`), below pieces (`z-25`)

### Animation
- **On mount:** `arrowFadeIn` — opacity 0→1 + scaleY 0.8→1, 0.4s ease-out
- **Idle:** `arrowIdlePulse` — opacity oscillates 0.60 → 0.75 → 0.60, 2s ease-in-out infinite

### Disappearance
- **Trigger:** After user's correct move (when `selectedSquare` or `dragPiece` is active)
- **Implementation:** Conditional render `{guideArrows.length > 0 && !selectedSquare && !dragPiece && (...)}`

## Files Modified
- `src/components/LessonClient.tsx` — arrow SVG: color, strokeWidth logic, z-20, className
- `src/app/globals.css` — keyframes `arrowFadeIn`, `arrowIdlePulse`; `.arrow-hint-line` class

## Deployment
- Commit: `1242705`
- URL: https://chess-course-platform-designer.vercel.app
