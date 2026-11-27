export const getPercentageDiff = (original: number, calculated: number) => {
  if (!original || !Number.isFinite(original) || !Number.isFinite(calculated)) return "0"
  const decrease = ((original - calculated) / original) * 100
  return Number.isFinite(decrease) ? decrease.toFixed() : "0"
}
