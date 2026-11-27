import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function EmptyProducts({ message = "No bags here yet." }: { message?: string }) {
  return (
    <div className="w-full flex flex-col items-center justify-center text-center gap-3 py-16 px-4" data-testid="empty-products">
      <p className="text-lg font-semibold text-gray-900">{message}</p>
      <p className="text-sm text-gray-500 max-w-sm">New designs are added often. Take a look at the full collection in the meantime.</p>
      <LocalizedClientLink href="/store" className="mt-2 inline-flex items-center h-11 px-6 rounded-full bg-black text-white text-sm font-medium">
        Shop all bags
      </LocalizedClientLink>
    </div>
  )
}
