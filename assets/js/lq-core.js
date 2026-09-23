(() => {
  const MS_DAY = 86400000;

  function parseDateOnly(value) {
    if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!m) throw new Error(`Ungültiges Datum: ${value}`);
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  function dateToISO(value) {
    const d = value instanceof Date ? value : parseDateOnly(value);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function addDays(value, days) {
    const d = parseDateOnly(value);
    d.setDate(d.getDate() + Number(days || 0));
    return dateToISO(d);
  }

  function inclusiveDays(start, end) {
    const a = parseDateOnly(start);
    const b = parseDateOnly(end);
    return Math.max(1, Math.round((b - a) / MS_DAY) + 1);
  }

  function isoWeekInfo(value) {
    const [y, m, d] = dateToISO(value).split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    let day = dt.getUTCDay();
    if (day === 0) day = 7;
    dt.setUTCDate(dt.getUTCDate() + 4 - day);
    const isoYear = dt.getUTCFullYear();
    const yearStart = new Date(Date.UTC(isoYear, 0, 1));
    const week = Math.ceil((((dt - yearStart) / MS_DAY) + 1) / 7);
    return { year: isoYear, week };
  }

  function computedKW(event) {
    const a = isoWeekInfo(event.start);
    const b = isoWeekInfo(event.end);
    if (a.year === b.year && a.week === b.week) return String(a.week);
    if (a.year === b.year) return `${a.week}–${b.week}`;
    return `${a.year}/${a.week}–${b.year}/${b.week}`;
  }

  function normalizeKW(value) {
    return String(value ?? '').trim().replace(/\s+/g, '').replace(/-/g, '–');
  }

  function kwMatches(event) {
    return normalizeKW(event.sourceKW) === normalizeKW(computedKW(event));
  }

  function mergePlanEvent(previous, incoming, options = {}) {
    const merged = { ...(previous || {}), ...(incoming || {}) };
    const protectedOptional = previous?.obligation === 'Optional' && previous?.statusOrigin === 'reference';
    if (protectedOptional) {
      merged.obligation = 'Optional';
      merged.statusOrigin = 'reference';
      merged.statusNote = previous.statusNote || 'Optional-Status aus Referenzplan beibehalten';
    } else if (incoming && Object.prototype.hasOwnProperty.call(incoming, 'obligation')) {
      merged.statusOrigin = previous && incoming.obligation === previous.obligation
        ? (previous.statusOrigin || 'reference')
        : 'manual';
    }
    return merged;
  }

  function timelinePercent(value, rangeStart, rangeEnd) {
    const start = parseDateOnly(rangeStart);
    const end = parseDateOnly(rangeEnd);
    const current = parseDateOnly(value);
    const total = Math.max(MS_DAY, end - start);
    const pct = ((current - start) / total) * 100;
    return Math.max(0, Math.min(100, Number(pct.toFixed(6))));
  }

  function timelineSpan(startValue, endValue, rangeStart, rangeEnd, minWidthPct = 0.8) {
    const leftPct = timelinePercent(startValue, rangeStart, rangeEnd);
    const endPct = timelinePercent(addDays(endValue, 1), rangeStart, rangeEnd);
    const widthPct = Math.max(minWidthPct, endPct - leftPct);
    return {
      leftPct: Math.min(100 - minWidthPct, leftPct),
      widthPct: Math.min(100 - leftPct, widthPct),
    };
  }

  function compressDayRanges(days) {
    const sorted = [...new Set(days)].sort((a, b) => a - b);
    if (!sorted.length) return [];
    const ranges = [];
    let start = sorted[0];
    let prev = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === prev + 1) {
        prev = sorted[i];
      } else {
        ranges.push([start, prev]);
        start = prev = sorted[i];
      }
    }
    ranges.push([start, prev]);
    return ranges;
  }

  function splitWorkWeek(monday, config) {
    const base = config.base || {};
    const pieces = [];
    const add = (days, obligation, suffix) => {
      for (const [first, last] of compressDayRanges(days || [])) {
        pieces.push({
          ...base,
          id: `${base.id}-${suffix}-${first}-${last}`,
          start: addDays(monday, first - 1),
          end: addDays(monday, last - 1),
          obligation,
          statusOrigin: obligation === 'Optional' ? 'reference' : (base.statusOrigin || 'reference'),
        });
      }
    };
    add(config.optionalDays, 'Optional', 'opt');
    add(config.mandatoryDays, 'Pflicht', 'req');
    return pieces.sort((a, b) => a.start.localeCompare(b.start));
  }


  function workingDays(startValue, endValue) {
    if (!startValue || !endValue) return 0;
    let d = parseDateOnly(startValue);
    const end = parseDateOnly(endValue);
    let count = 0;
    while (d <= end) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) count++;
      d.setDate(d.getDate() + 1);
    }
    return count;
  }

  function requirementProgress(events, requirementId, targetDays) {
    const blocks = (events || []).filter((event) => event.requirementId === requirementId && event.start && event.end);
    const plannedDays = blocks.reduce((sum, event) => {
      const hasManual = event.creditDays !== '' && event.creditDays !== null && event.creditDays !== undefined;
      const manual = hasManual ? Number(event.creditDays) : NaN;
      return sum + (Number.isFinite(manual) && manual >= 0 ? manual : workingDays(event.start, event.end));
    }, 0);
    const target = Math.max(0, Number(targetDays || 0));
    return {
      plannedDays,
      remainingDays: Math.max(0, target - plannedDays),
      percent: target ? Math.min(100, Math.round((plannedDays / target) * 100)) : 0,
      done: target > 0 && plannedDays >= target,
      blocks,
    };
  }

  function formatRange(start, end, locale = 'de-DE') {
    const fmt = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (start === end) return fmt.format(parseDateOnly(start));
    return `${fmt.format(parseDateOnly(start))} – ${fmt.format(parseDateOnly(end))}`;
  }

  function filterEvents(events, filters = {}) {
    const text = String(filters.search || '').trim().toLocaleLowerCase('de-DE');
    const participant = filters.participant || 'qualifier';
    const status = filters.status || 'all';
    return [...events].filter((event) => {
      const relevance = event.relevance || 'Beide';
      if (participant === 'qualifier' && relevance === 'Anwärter') return false;
      if (participant === 'trainee' && relevance === 'Qualifizierer') return false;
      if (status === 'mandatory' && event.obligation !== 'Pflicht') return false;
      if (status === 'optional' && event.obligation !== 'Optional') return false;
      if (status === 'planning' && event.planningState !== 'pending') return false;
      if (filters.year && filters.year !== 'all' && !String(event.start || '').startsWith(String(filters.year)) && !String(event.end || '').startsWith(String(filters.year))) return false;
      if (filters.category && filters.category !== 'all' && event.category !== filters.category) return false;
      if (text) {
        const hay = [event.title, event.location, event.category, event.obligation, event.sourceKW, event.notes, event.relevance].join(' ').toLocaleLowerCase('de-DE');
        if (!hay.includes(text)) return false;
      }
      return true;
    }).sort((a, b) => String(a.start || '9999').localeCompare(String(b.start || '9999')) || a.title.localeCompare(b.title, 'de'));
  }

  globalThis.LQCore = {
    addDays,
    computedKW,
    dateToISO,
    filterEvents,
    formatRange,
    inclusiveDays,
    workingDays,
    requirementProgress,
    isoWeekInfo,
    kwMatches,
    mergePlanEvent,
    parseDateOnly,
    splitWorkWeek,
    timelinePercent,
    timelineSpan,
  };
})();
