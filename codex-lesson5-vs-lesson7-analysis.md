# Codex Analysis: Lesson 5 vs Lesson 7

## Prompt
Compare these two chess lesson components in the repository. Do NOT modify any files — only analyze and report differences.

Component A: Lesson 5 — collect-stars board (InlineChessBoard inside src/components/LessonClient.tsx). This is the interactive board for "collect stars" exercises (knight, bishop, etc.).

Component B: Lesson 7 — capture board (src/components/CaptureBoard.tsx + src/components/CaptureLessonWrapper.tsx). This is the interactive board for "capture pieces" exercises (rook takes pawns, etc.).

Analyze and report:
1. Board rendering differences (colors, border, shadow, square size calculation, coordinates display)
2. Piece rendering differences (SVG source, size, filter/shadow)
3. Interaction model differences (drag-and-drop, click-to-move, pointer events, move validation)
4. Hint system differences (hint arrows, hint levels, auto-check, feedback messages)
5. State management differences (useState vs useRef, position updates, promotion handling)
6. Exercise flow differences (level switching, success/fail detection, star collection vs piece capture)
7. Any other architectural or UX differences

Be specific — cite file paths and line numbers where relevant.

---

## Codex Output

**1. Board Rendering**
- Both boards use the same base board shell: `grid`, `border-[5px] border-[#1a1612]`, rounded corners, `board-fade-in`, CSS square colors, and the same shadow string. See [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:688) and [CaptureBoard.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/CaptureBoard.tsx:742).
- Square size calculation is effectively identical: mobile `42..80px`, desktop `56..84px`, using `window.innerWidth - 520`. See [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:487) and [CaptureBoard.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/CaptureBoard.tsx:554).
- Coordinates differ in color source:
  - Lesson 5 uses theme variables: `var(--square-dark)` / `var(--square-light)` at [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:725).
  - Lesson 7 hardcodes lichess-style colors `#b58863` / `#f0d9b5` at [CaptureBoard.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/CaptureBoard.tsx:791).
- Lesson 5 renders visible collectible stars on board squares with `StarSvg` and `star-twinkle` at [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:740). Lesson 7's inline board does not render target stars at all; its targets are handled by move logic, usually occupied black-piece squares.

**2. Piece Rendering**
- Both use the same SVG source path: `/pieces/cburnett/${color}${type}.svg`. See [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:386) and [CaptureBoard.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/CaptureBoard.tsx:500).
- Both apply `filter: var(--piece-shadow-inline)` inside `PieceImg`.
- Size differs:
  - Lesson 5 wraps pieces at about `85%` of square size: [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:761).
  - Lesson 7 renders `PieceImg` directly full-square: [CaptureBoard.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/CaptureBoard.tsx:822).
- Drag rendering differs:
  - Lesson 5 uses a fixed viewport-positioned ghost at `85%` square size: [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:867).
  - Lesson 7 uses an absolute ghost inside the board at full square size: [CaptureBoard.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/CaptureBoard.tsx:827).
- Lesson 5 has a promotion picker using the same cburnett SVGs at [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:812). Lesson 7 has no promotion UI.

**3. Interaction Model**
- Lesson 5 supports click-to-move through pointer-up with no drag threshold crossed, and drag-to-move after a `20px` movement threshold. See [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:570) and [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:585).
- Lesson 7 starts `dragState` immediately on pointer down, treats any pointer movement as a drag, and also has a real `onClick` handler guarded by `justDraggedRef`. See [CaptureBoard.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/CaptureBoard.tsx:643), [CaptureBoard.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/CaptureBoard.tsx:673), and [CaptureBoard.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/CaptureBoard.tsx:773).
- Drop target detection differs:
  - Lesson 5 uses `document.elementFromPoint(...).closest('[data-square]')`: [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:507).
  - Lesson 7 computes file/rank from board bounding rect and `sqSize`: [CaptureBoard.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/CaptureBoard.tsx:700).
- Move validation differs architecturally:
  - Lesson 5 `isValidMove` is white-only and treats stars as blockers except destination stars: [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:120).
  - Lesson 7 `isValidMove` accepts `movingColor`, `ignoreTargetOccupant`, and supports black validation for auto-captures/check logic: [CaptureBoard.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/CaptureBoard.tsx:57).
- Lesson 7 also filters `forbiddenSquares` from highlighted valid moves and rejects clicked forbidden destinations: [CaptureBoard.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/CaptureBoard.tsx:585), [CaptureBoard.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/CaptureBoard.tsx:622). Lesson 5 has no equivalent board prop.

**4. Hint System**
- Lesson 5 has a much richer hint system:
  - `hintLevel` state exists separately from arrows: [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:1003).
  - It can highlight the moving piece, valid squares, and target square: [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:652).
  - It computes a real path using BFS/TSP over remaining stars: [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:1039).
- Lesson 7 wrapper has a placeholder hint implementation that always returns `[]`: [CaptureLessonWrapper.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/CaptureLessonWrapper.tsx:77). It can show textual hint content, but not computed arrows unless passed externally.
- Both arrow renderers use the same SVG path construction and `arrow-hint-line` styling. Lesson 5 supports guide arrows before first move as well as hint arrows: [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:770). Lesson 7 only renders `hintArrows`: [CaptureBoard.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/CaptureBoard.tsx:841).
- Lesson 5 clears hints on every move: [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:1351). Lesson 7 wrapper clears hint arrows via `onAnyMove`: [CaptureLessonWrapper.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/CaptureLessonWrapper.tsx:130).

**5. State Management**
- Lesson 5 keeps `position` plus `positionRef`, `movesRef`, `currentLevelRef`, `movedPieces`, `phase`, `promotionPending`, `hintLevel`, and `visibleStars`. See [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:930), [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:960), and [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:973).
- Lesson 7 splits some state between wrapper and board when embedded. Wrapper owns current level, stars, hints, and persistence; `CaptureBoard` can use external or internal level/star state. See [CaptureLessonWrapper.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/CaptureLessonWrapper.tsx:34) and [CaptureBoard.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/CaptureBoard.tsx:957).
- Lesson 5 handles promotion explicitly: move to rank 8 sets `promotionPending`, then `handlePromotion` updates FEN with chosen piece. See [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:1421) and [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:1575).
- Lesson 7 has no promotion state; a pawn reaching promotion rank is just moved as its current piece type.

**6. Exercise Flow**
- Lesson 5 is a "collect all stars" flow by default. Completion requires every star in the level to be collected: [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:1550).
- Lesson 7 is a "capture target / tactical condition" flow. For normal targets, one target completes unless `requireAll === true`: [CaptureBoard.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/CaptureBoard.tsx:1478).
- Lesson 5 uses explicit `phase`: `intro`, `playing`, `success`, `fail`; success overlay auto-advances after `1200ms`: [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:979), [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:1755).
- Lesson 7 uses `gameOver`, `failed`, and `allDone`, without the same phase overlay model. It advances after `600ms` on success paths: [CaptureBoard.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/CaptureBoard.tsx:1314).
- Lesson 7 has black-response mechanics absent from Lesson 5: initial auto moves, triggered auto moves, explicit auto-captures, universal black auto-capture of undefended white pieces, mate/check/stalemate validation. See [CaptureBoard.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/CaptureBoard.tsx:1039), [CaptureBoard.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/CaptureBoard.tsx:1124), and [CaptureBoard.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/CaptureBoard.tsx:1197).

**7. Other Architectural / UX Differences**
- Lesson 5 is self-contained inside `LessonClient.tsx` as `MultiLevelStarBoard` plus its embedded `InlineChessBoard`. Lesson 7 is split into `CaptureLessonWrapper.tsx` for embedded lesson chrome and `CaptureBoard.tsx` for board/game logic.
- Lesson 5 persists progress under `lesson_progress_${currentLessonId}` and syncs current level to URL hash `#level=N`: [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:917), [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:964).
- Lesson 7 persists under `lesson_capture_${lesson.id}` and does not use URL hash in the wrapper: [CaptureLessonWrapper.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/CaptureLessonWrapper.tsx:39).
- UX failure style differs: Lesson 5 uses a contextual overlay with hint/reset over the board: [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:1794). Lesson 7 embedded mode shows a large red fail banner below the board: [CaptureBoard.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/CaptureBoard.tsx:1539).
- Lesson 5 displays collectible progress while playing using star icons based on `collectedCount`: [LessonClient.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/LessonClient.tsx:2029). Lesson 7 computes `remainingBlack`, but the shown embedded UX mostly relies on level pills and failure/success state: [CaptureBoard.tsx](/home/sergey/sergey-hq/chess-course-platform-designer/src/components/CaptureBoard.tsx:1519).
