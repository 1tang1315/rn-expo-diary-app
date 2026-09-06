export function sqlEventDurationMinutes(alias = '') {
  const p = alias ? `${alias}.` : '';
  return `CASE WHEN ${p}time_kind = 'instant' THEN 0 ELSE (JULIANDAY(${p}end_datetime) - JULIANDAY(${p}start_datetime)) * 24 * 60 END`;
}

export function sqlEventDurationHours(alias = '') {
  const p = alias ? `${alias}.` : '';
  return `CASE WHEN ${p}time_kind = 'instant' THEN 0 ELSE (JULIANDAY(${p}end_datetime) - JULIANDAY(${p}start_datetime)) * 24 END`;
}
