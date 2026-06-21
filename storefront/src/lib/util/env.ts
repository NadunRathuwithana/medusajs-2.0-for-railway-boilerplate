export const getBaseURL = () => {
  return process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:8000"
  // return process.env.NEXT_PUBLIC_BASE_URL || "https://cardle.lk"
}
