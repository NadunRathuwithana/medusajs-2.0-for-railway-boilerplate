import { deleteLineItem } from "@lib/data/cart"
import { Spinner, Trash } from "@medusajs/icons"
import { clx } from "@medusajs/ui"
import React, { useState } from "react"

const DeleteButton = ({
  id,
  children,
  className,
  "data-testid": dataTestId,
}: {
  id: string
  children?: React.ReactNode
  className?: string
  "data-testid"?: string
}) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    setDeleteError(null)
    await deleteLineItem(id).catch((_err) => {
      setDeleteError("Failed to remove item. Please try again.")
      setIsDeleting(false)
    })
  }

  return (
    <div
      className={clx(
        "flex flex-col items-end text-small-regular",
        className
      )}
    >
      <button
        className="flex gap-x-1 text-ui-fg-subtle hover:text-ui-fg-base cursor-pointer"
        onClick={() => handleDelete(id)}
        disabled={isDeleting}
        data-testid={dataTestId}
      >
        {isDeleting ? <Spinner className="animate-spin" /> : <Trash />}
        <span>{children}</span>
      </button>
      {deleteError && (
        <span className="text-xs text-red-500 mt-1">{deleteError}</span>
      )}
    </div>
  )
}

export default DeleteButton
