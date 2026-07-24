-- ============================================
-- Урок 13: Рокировка — добавить guideArrows для подсказок
-- Выполните в Supabase Dashboard → SQL Editor
-- ============================================

UPDATE lessons
SET video_url = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  video_url::jsonb,
                  '{levels,0,guideArrows}',
                  '[{"from":"e1","to":"g1"}]'::jsonb,
                  true
                ),
                '{levels,1,guideArrows}',
                '[{"from":"e1","to":"c1"}]'::jsonb,
                true
              ),
              '{levels,2,guideArrows}',
              '[{"from":"g1","to":"f3"},{"from":"e1","to":"g1"}]'::jsonb,
              true
            ),
            '{levels,3,guideArrows}',
            '[{"from":"e2","to":"e4"},{"from":"g1","to":"f3"},{"from":"e1","to":"g1"}]'::jsonb,
            true
          ),
          '{levels,4,guideArrows}',
          '[{"from":"b1","to":"c3"},{"from":"c1","to":"e3"},{"from":"d1","to":"e2"},{"from":"e1","to":"c1"}]'::jsonb,
          true
        ),
        '{levels,5,guideArrows}',
        '[{"from":"e1","to":"c1"}]'::jsonb,
        true
      ),
      '{levels,6,guideArrows}',
      '[{"from":"e3","to":"e4"},{"from":"e1","to":"g1"}]'::jsonb,
      true
    ),
    '{levels,7,guideArrows}',
    '[{"from":"f1","to":"h3"},{"from":"e1","to":"g1"}]'::jsonb,
    true
  ),
  '{levels,8,guideArrows}',
  '[{"from":"b1","to":"d2"},{"from":"e1","to":"c1"}]'::jsonb,
  true
)
WHERE title = 'Урок 13: Рокировка'
  AND jsonb_typeof(video_url::jsonb->'levels') = 'array';
