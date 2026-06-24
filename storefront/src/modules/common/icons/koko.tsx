import React from "react"

const Koko = ({ size = "24", className, ...attributes }: any) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...attributes}
    >
      <rect width="24" height="24" rx="4" fill="#6B21A8" />
      <path
        d="M8 6V18M8 12L15 6M8 12L15 18"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default Koko
