"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { clx } from "@medusajs/ui"
import { SortOptions } from "../refinement-list/sort-products"
import { ListFilter } from "lucide-react"

const sortOptions = [
  { value: "most_relevant", label: "Most relevant" },
  { value: "best_selling", label: "Best selling" },
  { value: "price_asc", label: "Price, low to high" },
  { value: "price_desc", label: "Price, high to low" },
] as const

export default function SortDropdown({ sortBy }: { sortBy: SortOptions }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeOption = sortOptions.find((opt) => opt.value === sortBy) || sortOptions[1] // default to Best selling if not matched

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("sortBy", value)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
    setIsOpen(false)
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Dynamic Keyframe Animations for Fluid Transitions */}
      <style>{`
        @keyframes dropdownReveal {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes dropdownItemReveal {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-dropdown-reveal {
          animation: dropdownReveal 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: top right;
        }
        .animate-dropdown-item {
          opacity: 0;
          animation: dropdownItemReveal 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Trigger Button */}
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline text-gray-600 font-medium text-sm">Sort by:</span>
        
        {/* Mobile Icon Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="sm:hidden flex items-center justify-center w-10 h-10 rounded-full border border-black bg-white text-black hover:bg-gray-50 transition-colors duration-200"
          aria-label="Sort options"
        >
          <ListFilter className="w-4 h-4" />
        </button>

        {/* Desktop Text Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="hidden sm:inline-flex items-center justify-between gap-3 px-6 py-2.5 rounded-full border border-black text-sm font-semibold tracking-wide bg-white text-bold hover:bg-gray-50 transition-colors duration-200 min-w-[160px]"
        >
          <span>{activeOption.label}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-black flex-shrink-0" />
        </button>
      </div>

      {/* Dropdown Menu Overlay */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-[280px] bg-[#111111] text-white rounded-3xl p-6 shadow-2xl z-50 animate-dropdown-reveal">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-3">
            <span className="text-[10px] font-bold tracking-widest text-gray-500 capitalize">
              Sort by
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-transform duration-300 hover:rotate-90"
              aria-label="Close sort options"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Options List */}
          <div className="flex flex-col gap-4">
            {sortOptions.map((option, index) => {
              const isSelected = option.value === sortBy
              return (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={clx(
                    "animate-dropdown-item flex items-center justify-between text-left text-sm font-semibold py-1 transition-all duration-200",
                    isSelected
                      ? "text-gray-400 cursor-default"
                      : "text-white hover:text-gray-300"
                  )}
                  style={{ animationDelay: `${50 + index * 22}ms` }}
                  disabled={isSelected}
                >
                  <span>{option.label}</span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
