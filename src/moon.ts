export function getMoonPhase(date: Date) {
  // ported from http://www.voidware.com/moon_phase.htm
  let year = date.getFullYear()
  let month = date.getMonth() //index 0-11 check
  let day = date.getDate()
  if (month < 3) {
    year--
    month += 12
  }
  ++month
  let jd = 365.25 * year + 30.6 * month + day - 694039.09 // jd is total days elapsed
  jd /= 29.53 // divide by the moon cycle (29.53 days)
  jd = jd % 1 // modulus operator (remainder)
  return jd
}

export function getMoonPhaseLabel(phase: number) {
  phase = Math.ceil(phase * 8) // scale fraction from 0-8 and round by adding 0.5
  phase = phase & 7 // 0 and 8 are the same so turn 8 into 0
  switch (phase) {
    case 0:
      return 'New Moon'
    case 1:
      return 'Waxing Crescent Moon'
    case 2:
      return 'Quarter Moon'
    case 3:
      return 'Waxing Gibbous Moon'
    case 4:
      return 'Full Moon'
    case 5:
      return 'Waning Gibbous Moon'
    case 6:
      return 'Last Quarter Moon'
    case 7:
      return 'Waning Crescent Moon'
  }
}
