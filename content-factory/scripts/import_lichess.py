"""Импорт лучших задач из открытой базы Lichess (CC0).
python3 -I scripts/import_lichess.py <lichess_db_puzzle.csv.zst> src/puzzles-lichess.json
Формат Lichess: FEN до хода соперника; Moves[0] — ход соперника, дальше решение.
Сохраняем: fen (до хода соперника), setup (ход соперника), moves (решение), rating, themes, plays, popularity, url.
"""
import csv, io, json, sys, collections
import zstandard
src, dst = sys.argv[1], sys.argv[2]
# категории для начинающих и не только
BUCKETS = {
  'mateIn1':   lambda r, t: 'mateIn1' in t and r <= 1200,
  'mateIn2':   lambda r, t: 'mateIn2' in t and r <= 1400,
  'opening':   lambda r, t: 'opening' in t and r <= 1400,
  'fork':      lambda r, t: 'fork' in t and 'short' in t and r <= 1300,
  'pin':       lambda r, t: 'pin' in t and 'short' in t and r <= 1400,
  'sacrifice': lambda r, t: 'sacrifice' in t and ('mateIn2' in t or 'mateIn3' in t) and r <= 1600,
  'smothered': lambda r, t: 'smotheredMate' in t,
  'queenSac':  lambda r, t: 'queensideAttack' not in t and 'sacrifice' in t and 'mate' in t and r <= 1800,
  'endgame':   lambda r, t: 'endgame' in t and 'short' in t and r <= 1300,
}
best = collections.defaultdict(list)
with open(src, 'rb') as fh:
    rd = csv.reader(io.TextIOWrapper(zstandard.ZstdDecompressor().stream_reader(fh), encoding='utf-8'))
    head = next(rd); ix = {k: i for i, k in enumerate(head)}
    for row in rd:
        pop, plays, rating = int(row[ix['Popularity']]), int(row[ix['NbPlays']]), int(row[ix['Rating']])
        if pop < 90 or plays < 3000: continue
        themes = row[ix['Themes']].split()
        for b, f in BUCKETS.items():
            if f(rating, themes):
                best[b].append((plays, row))
out = []
for b, lst in best.items():
    lst.sort(key=lambda x: -x[0])
    for plays, row in lst[:600]:
        mv = row[ix['Moves']].split()
        out.append({'id': row[ix['PuzzleId']], 'bucket': b, 'fen': row[ix['FEN']], 'setup': mv[0], 'moves': mv[1:],
                    'rating': int(row[ix['Rating']]), 'themes': row[ix['Themes']].split(), 'plays': plays,
                    'popularity': int(row[ix['Popularity']]), 'url': row[ix['GameUrl']]})
json.dump(out, open(dst, 'w'))
print({b: min(600, len(l)) for b, l in best.items()}, 'total', len(out))
