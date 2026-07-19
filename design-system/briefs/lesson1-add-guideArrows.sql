-- Добавить guideArrows к уровням Урока 1
-- Выполнить в Supabase Dashboard → SQL Editor

UPDATE lessons
SET video_url = jsonb_set(
  video_url::jsonb,
  '{levels}',
  (
    SELECT jsonb_agg(
      CASE idx
        WHEN 0 THEN jsonb_set(lvl, '{guideArrows}', '[{"from":"d2","to":"d7"}]'::jsonb)
        WHEN 1 THEN jsonb_set(lvl, '{guideArrows}', '[{"from":"f7","to":"f5"},{"from":"f5","to":"b5"}]'::jsonb)
        ELSE jsonb_set(lvl, '{guideArrows}', '[]'::jsonb)
      END
    )
    FROM jsonb_array_elements(video_url::jsonb->'levels') WITH ORDINALITY AS t(lvl, idx)
  )
)
WHERE id = '871fd651-0b72-476a-a552-bc83a8d8b334';
