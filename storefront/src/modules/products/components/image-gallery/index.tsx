"use client"

import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { useState } from "react"
import { clx } from "@medusajs/ui"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0)

  if (!images || images.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-y-4 w-full h-full relative">
      {/* Top Slider Progress Bar */}
      <div className="absolute top-4 left-0 right-0 z-10 flex gap-2 px-4">
        {images.map((_, idx) => (
          <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
            <div 
              className={clx("h-full bg-white transition-all duration-300", {
                "w-full": idx === activeIndex,
                "w-0": idx !== activeIndex
              })}
            />
          </div>
        ))}
      </div>

      {/* Main Image */}
      <div className="relative w-full aspect-[4/5] md:aspect-auto md:h-[600px] lg:h-[700px] rounded-3xl overflow-hidden bg-gray-100">
        <Image
          src={images[activeIndex].url}
          priority
          alt={`Product image ${activeIndex + 1}`}
          fill
          sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
          style={{ objectFit: "cover" }}
          className="transition-opacity duration-300"
        />
        
        {/* Thumbnails overlaid at bottom */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 px-4 w-full justify-center">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setActiveIndex(index)}
              className={clx(
                "relative w-20 h-24 md:w-24 md:h-28 rounded-2xl overflow-hidden transition-all duration-200 border-2",
                {
                  "border-white shadow-lg scale-110": index === activeIndex,
                  "border-transparent opacity-70 hover:opacity-100": index !== activeIndex,
                }
              )}
            >
              <Image
                src={image.url}
                alt={`Thumbnail ${index + 1}`}
                fill
                sizes="96px"
                style={{ objectFit: "cover" }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ImageGallery
