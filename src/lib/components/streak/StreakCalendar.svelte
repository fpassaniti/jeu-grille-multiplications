<script>
  import { _ } from '$lib/utils/i18n';
  import languageStore from '$lib/stores/languageStore';

  // Props
  export let streakDays = 0;
  export let initialMonth; // 'YYYY-MM' — mois chargé par le SSR, sert aussi de plafond de navigation
  export let initialPlayedDays = []; // dates ISO 'YYYY-MM-DD'
  export let earliestMonth = null; // 'YYYY-MM' | null (null = aucune partie jouée)
  export let milestoneProjections = []; // [{ milestone, date }]
  export let nextStreakMilestone = null;

  const RARITY_LABEL = { 3: 'commun', 7: 'rare', 14: 'épique', 30: 'légendaire', 60: 'mythique' };

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function toISO(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function shiftMonth(yyyyMm, delta) {
    const [y, m] = yyyyMm.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  }

  function buildMonthGrid(yyyyMm, playedSet, todayISO, milestoneByDate) {
    const [y, m] = yyyyMm.split('-').map(Number);
    const firstOfMonth = new Date(y, m - 1, 1);
    const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // Lundi = 0
    const daysInMonth = new Date(y, m, 0).getDate();
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const dayOffset = i - firstWeekday + 1;
      const cellDate = new Date(y, m - 1, dayOffset);
      const iso = toISO(cellDate);
      const inMonth = dayOffset >= 1 && dayOffset <= daysInMonth;
      cells.push({
        iso,
        day: cellDate.getDate(),
        inMonth,
        isToday: iso === todayISO,
        played: playedSet.has(iso),
        projectedMilestone: milestoneByDate.get(iso) ?? null
      });
    }
    return cells;
  }

  const todayISO = toISO(new Date());

  let viewMonth = initialMonth;
  let monthCache = { [initialMonth]: initialPlayedDays };
  let loading = false;
  let error = null;

  $: prevDisabled = !earliestMonth || viewMonth <= earliestMonth;
  $: nextDisabled = viewMonth >= initialMonth;

  async function goToMonth(yyyyMm) {
    if (yyyyMm > initialMonth) return;
    if (!earliestMonth || yyyyMm < earliestMonth) return;
    if (monthCache[yyyyMm]) {
      viewMonth = yyyyMm;
      return;
    }
    loading = true;
    error = null;
    try {
      const response = await fetch(`/api/streak/calendar?month=${yyyyMm}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur');
      monthCache = { ...monthCache, [yyyyMm]: data.playedDays };
      viewMonth = yyyyMm;
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  const goPrev = () => goToMonth(shiftMonth(viewMonth, -1));
  const goNext = () => goToMonth(shiftMonth(viewMonth, 1));

  let touchStartX = null;
  let touchStartY = null;

  function onTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }

  function onTouchEnd(e) {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    touchStartX = null;
    touchStartY = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) goNext();
    else goPrev();
  }

  $: lang = $languageStore;
  $: monthLabel = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(
    new Date(Number(viewMonth.slice(0, 4)), Number(viewMonth.slice(5, 7)) - 1, 1)
  );
  $: weekdayLabels = Array.from({ length: 7 }, (_unused, i) =>
    new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(new Date(2024, 0, 1 + i))
  );

  $: playedSet = new Set(monthCache[viewMonth] ?? []);
  $: milestoneByDate = new Map(milestoneProjections.map((p) => [p.date, p.milestone]));
  $: cells = buildMonthGrid(viewMonth, playedSet, todayISO, milestoneByDate);
</script>

<div class="card streak-calendar">
  <p class="streak-count">{_('streak.days', { count: streakDays })}</p>

  <div class="calendar-header">
    <button class="nav-button" on:click={goPrev} disabled={prevDisabled} aria-label="Mois précédent">‹</button>
    <span class="month-label">{monthLabel}</span>
    <button class="nav-button" on:click={goNext} disabled={nextDisabled} aria-label="Mois suivant">›</button>
  </div>

  <div class="weekday-row">
    {#each weekdayLabels as label}
      <span class="weekday-label">{label}</span>
    {/each}
  </div>

  <div
    class="month-grid"
    class:loading
    on:touchstart={onTouchStart}
    on:touchend={onTouchEnd}
  >
    {#each cells as cell (cell.iso)}
      <div class="day-cell" class:out-of-month={!cell.inMonth} class:today={cell.isToday}>
        <span class="day-number">{cell.day}</span>
        {#if cell.inMonth}
          {#if cell.iso <= todayISO}
            <span class="day-icon">{cell.played ? (cell.isToday ? '🔥' : '✅') : '⬜'}</span>
          {:else if cell.projectedMilestone}
            <span class="day-icon milestone-icon" title={`Palier ${cell.projectedMilestone} jours`}>🎁</span>
          {/if}
        {/if}
      </div>
    {/each}
  </div>

  {#if error}
    <p class="calendar-error">⚠️ {error}</p>
  {/if}

  {#if nextStreakMilestone}
    <p class="next-milestone">
      {_('streak.nextMilestone', {
        days: nextStreakMilestone - streakDays,
        reward: RARITY_LABEL[nextStreakMilestone]
      })}
    </p>
  {/if}
</div>

<style>
  .streak-calendar {
    padding: 20px;
  }

  .streak-count {
    margin: 0 0 15px;
    text-align: center;
    font-weight: bold;
    color: var(--primary-dark);
  }

  .calendar-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    margin-bottom: 10px;
  }

  .nav-button {
    width: 32px;
    height: 32px;
    line-height: 1;
    font-size: 1.1rem;
    background-color: var(--primary);
    color: white;
    border-radius: var(--border-radius-sm);
    box-shadow: 0 3px 0 var(--primary-dark);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-button:disabled {
    background-color: var(--text-light);
    box-shadow: 0 3px 0 var(--text-secondary);
    opacity: 0.5;
    cursor: default;
  }

  .month-label {
    min-width: 140px;
    text-align: center;
    font-weight: bold;
    color: var(--primary-dark);
    text-transform: capitalize;
  }

  .weekday-row,
  .month-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }

  .weekday-row {
    margin-bottom: 4px;
  }

  .weekday-label {
    text-align: center;
    font-size: 0.75rem;
    color: var(--text-light);
    text-transform: uppercase;
  }

  .month-grid {
    transition: opacity 0.15s;
    touch-action: pan-y;
  }

  .month-grid.loading {
    opacity: 0.5;
  }

  .day-cell {
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius-sm);
    background-color: var(--bg-secondary);
    gap: 2px;
  }

  .day-cell.out-of-month {
    opacity: 0.3;
  }

  .day-cell.today {
    border: 2px solid var(--accent);
  }

  .day-number {
    font-size: 0.7rem;
    color: var(--text-secondary);
  }

  .day-icon {
    font-size: 1.1rem;
    line-height: 1;
  }

  .milestone-icon {
    filter: drop-shadow(0 0 2px var(--rarity-mythic));
  }

  .calendar-error {
    text-align: center;
    color: var(--secondary-dark, #c62828);
    margin-top: 10px;
    font-size: 0.85rem;
  }

  .next-milestone {
    text-align: center;
    margin-top: 12px;
    font-size: 0.9rem;
    color: var(--text-secondary);
  }
</style>
