import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import Image from "next/image"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  "data-testid"?: string
  variants?: HttpTypes.StoreProductVariant[]
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
  variants,
}) => {
  const filteredOptions = option.values?.map((v) => v.value)
  const isColor = title.toLowerCase() === "color"

  return (
    <div className="flex flex-col gap-y-3">
      <span className="text-sm text-gray-500 font-medium">
        Select {title}
        {isColor && current && <span className="text-black ml-1 font-semibold">{current}</span>}
      </span>
      <div
        className="flex flex-wrap gap-3"
        data-testid={dataTestId}
      >
        {filteredOptions?.map((v) => {
          // If it's a color option, try to find a variant that matches this color to use its thumbnail
          let imageUrl = null
          if (isColor && variants) {
            const matchingVariant = variants.find((variant) => 
              variant.options?.some((opt) => opt.value === v && opt.option?.title?.toLowerCase() === "color")
            )
            // Use variant metadata image if available, else thumbnail
            if (matchingVariant?.thumbnail) {
              imageUrl = matchingVariant.thumbnail
            }
          }

          return (
              <button
                onClick={() => updateOption(option.title ?? "", v ?? "")}
                key={v}
                className={clx(
                  "transition-all duration-200",
                  {
                    "h-12 rounded-full min-w-[3.5rem] px-5 flex items-center justify-center text-sm font-medium overflow-hidden": !isColor || !imageUrl,
                    "flex flex-col items-center gap-1.5": isColor && imageUrl,
                    "bg-black text-white border border-black": (!isColor || !imageUrl) && v === current,
                    "bg-gray-50 text-gray-900 border border-gray-200 hover:bg-gray-100": (!isColor || !imageUrl) && v !== current,
                  }
                )}
                disabled={disabled}
                data-testid="option-button"
              >
                {isColor && imageUrl ? (
                  <>
                    <div className={clx("w-14 h-14 rounded-lg relative overflow-hidden transition-all duration-200", {
                      "border-2 border-black scale-105 shadow-md": v === current,
                      "border border-gray-200 hover:border-gray-300": v !== current,
                    })}>
                      <Image src={imageUrl} alt={v || "Color"} fill className="object-cover" sizes="56px" />
                    </div>
                    <span className={clx("text-xs font-medium", {
                      "text-black": v === current,
                      "text-gray-500": v !== current,
                    })}>{v}</span>
                  </>
                ) : (
                  v
                )}
              </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect
