CREATE OR REPLACE FUNCTION get_ticket_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_total       INTEGER;
  v_open        INTEGER;
  v_ai_resolved INTEGER;
  v_closed      INTEGER;
  v_ai_pct      NUMERIC;
  v_avg_hours   NUMERIC;
  v_per_day     JSONB;
BEGIN
  SELECT COUNT(*)                                                     INTO v_total       FROM "Ticket";
  SELECT COUNT(*)                                                     INTO v_open        FROM "Ticket" WHERE status = 'open';
  SELECT COUNT(*)                                                     INTO v_ai_resolved FROM "Ticket" WHERE "autoResolved";
  SELECT COUNT(*)                                                     INTO v_closed      FROM "Ticket" WHERE status IN ('resolved', 'closed');
  SELECT AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")) / 3600) INTO v_avg_hours   FROM "Ticket" WHERE "resolvedAt" IS NOT NULL;

  v_ai_pct := CASE
                WHEN v_closed > 0 THEN ROUND((v_ai_resolved::NUMERIC / v_closed) * 100, 1)
                ELSE 0
              END;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object('date', TO_CHAR(day, 'FMMon FMDD'), 'count', COALESCE(t.cnt, 0))
      ORDER BY day
    ),
    '[]'::JSONB
  )
  INTO  v_per_day
  FROM  generate_series(CURRENT_DATE - 29, CURRENT_DATE, '1 day') AS day
  LEFT JOIN (
    SELECT DATE("createdAt") AS d, COUNT(*)::INT AS cnt
    FROM   "Ticket"
    WHERE  "createdAt" >= CURRENT_DATE - 29
    GROUP  BY DATE("createdAt")
  ) t ON t.d = day;

  RETURN jsonb_build_object(
    'totalTickets',           v_total,
    'openTickets',            v_open,
    'aiResolvedTickets',      v_ai_resolved,
    'aiResolutionPercentage', v_ai_pct,
    'avgResolutionTimeHours', v_avg_hours,
    'ticketsPerDay',          v_per_day
  );
END;
$$;
