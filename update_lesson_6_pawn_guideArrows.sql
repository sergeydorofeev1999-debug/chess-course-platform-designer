-- ============================================
-- Урок 6: Пешка — добавить guideArrows перед началом уровней
-- Выполните в Supabase Dashboard → SQL Editor
-- ============================================

UPDATE lessons
SET video_url = jsonb_set(
  jsonb_set(
    jsonb_set(
      video_url::jsonb,
      '{levels,0,guideArrows}',
      '[{"from":"h5","to":"h6"},{"from":"h6","to":"h7"},{"from":"h7","to":"h8"},{"from":"h8","to":"c3"}]'::jsonb,
      true
    ),
    '{levels,2,guideArrows}',
    '[{"from":"d3","to":"d4"},{"from":"d4","to":"e5"},{"from":"e5","to":"f6"},{"from":"f6","to":"e7"}]'::jsonb,
    true
  ),
  '{levels,6,guideArrows}',
  '[{"from":"d2","to":"d4"}]'::jsonb,
  true
)
WHERE title = 'Урок 6: Как ходит пешка'
  AND jsonb_typeof(video_url::jsonb->'levels') = 'array';
