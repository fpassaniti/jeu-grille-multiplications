CREATE OR REPLACE FUNCTION public.add_user_xp(
    p_user_id UUID,
    p_xp_earned INTEGER, -- Cette valeur est la seule conservée (anciennement score et xp)
    p_update_streak BOOLEAN
)
    RETURNS TABLE (
                      returned_user_id UUID,
                      returned_xp INTEGER,
                      returned_level INTEGER,
                      returned_streak_days INTEGER,
                      returned_total_xp INTEGER -- Renommé de total_score pour consistance
                  ) AS $$
DECLARE
    current_date DATE := CURRENT_DATE;
    prev_streak INTEGER;
    last_played TIMESTAMP WITH TIME ZONE;
    new_level INTEGER;
    user_row user_progress%ROWTYPE;
BEGIN
    -- Get user's current stats
    SELECT *
    INTO user_row
    FROM user_progress
    WHERE user_id = p_user_id;

    prev_streak := user_row.streak_days;
    last_played := user_row.last_played_at;

    -- Calculate the new streak
    IF p_update_streak THEN
        IF last_played IS NULL THEN
            -- First time playing
            UPDATE user_progress
            SET streak_days = 1
            WHERE user_id = p_user_id;
        ELSIF DATE(last_played) = current_date - INTERVAL '1 day' THEN
            -- Consecutive day
            UPDATE user_progress
            SET streak_days = streak_days + 1
            WHERE user_id = p_user_id;
        ELSIF DATE(last_played) != current_date THEN
            -- Not consecutive
            UPDATE user_progress
            SET streak_days = 1
            WHERE user_id = p_user_id;
        END IF;
    END IF;

    -- Update last played date
    UPDATE user_progress
    SET last_played_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id;

    -- Add XP, increment games played, and update total XP
    UPDATE user_progress
    SET
        xp = xp + p_xp_earned,
        games_played = games_played + 1,
        total_score = total_score + p_xp_earned -- Pourrait être renommé en total_xp dans une migration future
    WHERE user_id = p_user_id
    RETURNING
        user_id as returned_user_id,
        xp as returned_xp,
        level as returned_level,
        streak_days as returned_streak_days,
        total_score as returned_total_xp -- Retourne total_score mais nommé returned_total_xp
        INTO
            returned_user_id,
            returned_xp,
            returned_level,
            returned_streak_days,
            returned_total_xp;

    -- Determine the new level based on XP thresholds in level_definitions table
    SELECT MAX(level)
    INTO new_level
    FROM level_definitions
    WHERE min_xp <= returned_xp;

    -- Update level if needed
    IF new_level > user_row.level THEN
        UPDATE user_progress
        SET level = new_level
        WHERE user_id = p_user_id;

        -- Return updated level
        returned_level := new_level;
    END IF;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.add_user_xp IS 'Updates user XP, streak, and level based on game performance';
