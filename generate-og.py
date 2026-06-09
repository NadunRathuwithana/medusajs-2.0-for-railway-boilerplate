from PIL import Image
import os

logo_path = r"f:\medusajs-2.0-for-railway-boilerplate\storefront\public\Logo.png"
out_path = r"f:\medusajs-2.0-for-railway-boilerplate\storefront\public\og-image.jpg"

try:
    logo = Image.open(logo_path).convert("RGBA")
    
    bg = Image.new("RGB", (1200, 630), "white")
    
    logo.thumbnail((600, 400), Image.Resampling.LANCZOS)
    
    x = (1200 - logo.width) // 2
    y = (630 - logo.height) // 2
    
    bg.paste(logo, (x, y), logo)
    
    bg.save(out_path, "JPEG", quality=90)
    print("OG Image successfully created!")
except Exception as e:
    print(f"Error: {e}")
