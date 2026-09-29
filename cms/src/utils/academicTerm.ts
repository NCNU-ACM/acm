export interface AcademicTerm {
  /** 學年（民國），例如 115 */
  year: number;
  /** 學期：'1' 上學期、'2' 下學期 */
  part: '1' | '2';
}

// 8 月到隔年 1 月是當學年的上學期，2 月到 7 月是前一學年的下學期：
// 2026-09 → 1151、2027-01 → 1151、2027-02 → 1152、2027-07 → 1152、2027-08 → 1161。
export function getAcademicTerm(date: Date = new Date()): AcademicTerm {
  const month = date.getMonth() + 1;
  const year = date.getFullYear() - 1911 - (month <= 7 ? 1 : 0);
  const part = month >= 8 || month === 1 ? '1' : '2';
  return { year, part };
}

// 學年下拉選單：目前學年的前 2 年到後 2 年。
export function academicYearOptions(currentYear: number): number[] {
  return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
}
