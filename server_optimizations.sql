-- ============================================================
-- LosevSekret: SQL-оптимизации для PostgreSQL
-- Выполнить на сервере: psql -U <user> -d <dbname> -f server_optimizations.sql
-- ============================================================

-- 1. ИНДЕКСЫ на часто используемые запросы
-- ─────────────────────────────────────────

-- daily: поиск по пользователю + дате (loadDaily, refreshDiary)
CREATE INDEX IF NOT EXISTS idx_daily_user_date
  ON daily(external_user_id, local_date);

-- meals: поиск по пользователю + дате (список приёмов пищи за день)
CREATE INDEX IF NOT EXISTS idx_meals_user_date
  ON meals(external_user_id, local_date);

-- meals: поиск дубликатов текстовых запросов (серверный кеш анализа)
CREATE INDEX IF NOT EXISTS idx_meals_caption
  ON meals(caption) WHERE caption IS NOT NULL AND caption != '';

-- water: ежедневный трекинг воды
CREATE INDEX IF NOT EXISTS idx_water_user_date
  ON water(external_user_id, date);

-- habits_logs: логи привычек по пользователю
CREATE INDEX IF NOT EXISTS idx_habits_logs_user
  ON habits_logs(external_user_id);

-- nutri_chat: история чата — polling по timestamp
CREATE INDEX IF NOT EXISTS idx_nutri_chat_user_ts
  ON nutri_chat(external_user_id, created_at);

-- nutri_assignments: привязка пользователя к нутрициологу
CREATE INDEX IF NOT EXISTS idx_nutri_assign_user
  ON nutri_assignments(external_user_id);


-- 2. СЕРВЕРНЫЙ RATE-LIMIT (проверка в n8n workflow перед вызовом OpenAI)
-- ─────────────────────────────────────────────────────────────────────
-- В n8n workflow "Analyze meal" добавить SQL-ноду ПЕРЕД вызовом OpenAI:
--
--   SELECT COUNT(*) as cnt
--   FROM meals
--   WHERE external_user_id = '{{ $json.external_user_id }}'
--     AND local_date = CURRENT_DATE;
--
-- Если cnt >= 15, вернуть ошибку { ok: false, error: "daily_limit" }
-- и НЕ вызывать OpenAI.


-- 3. КЕШ ТРЕНИРОВОК ИЗ NOTION (опционально)
-- ─────────────────────────────────────────────
-- Чтобы не дёргать Notion API на каждый запрос

CREATE TABLE IF NOT EXISTS workouts_cache (
  notion_page_id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- В n8n workflow "loadWorkouts":
-- 1) SELECT data FROM workouts_cache WHERE notion_page_id = $1 AND cached_at > NOW() - INTERVAL '1 hour';
-- 2) Если есть — вернуть из кеша
-- 3) Если нет — запросить Notion → INSERT/UPDATE workouts_cache → вернуть


-- 4. КЕШ ТЕКСТОВЫХ АНАЛИЗОВ ЕДЫ (экономия OpenAI)
-- ─────────────────────────────────────────────────
-- В n8n workflow "Analyze text meal", ПЕРЕД вызовом OpenAI:
--
--   SELECT calories, protein_g, fat_g, carbs_g, items_json
--   FROM meals
--   WHERE caption = '{{ $json.caption }}'
--     AND confidence > 0.8
--   ORDER BY created_at_iso DESC
--   LIMIT 1;
--
-- Если найден — использовать эти данные вместо вызова GPT.
-- Экономия: ~10-30% вызовов OpenAI для повторяющихся описаний.


-- 5. ОЧИСТКА СТАРЫХ ДАННЫХ (опционально, запускать по cron раз в месяц)
-- ─────────────────────────────────────────────────────────────────────

-- Очистка кеша тренировок старше 7 дней
-- DELETE FROM workouts_cache WHERE cached_at < NOW() - INTERVAL '7 days';

-- Проверка размера таблиц
-- SELECT relname, pg_size_pretty(pg_total_relation_size(oid))
-- FROM pg_class WHERE relkind='r' ORDER BY pg_total_relation_size(oid) DESC LIMIT 20;
