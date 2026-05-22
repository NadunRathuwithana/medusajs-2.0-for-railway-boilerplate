import { Disclosure } from "@headlessui/react"
import { Badge, Button, clx } from "@medusajs/ui"
import { useEffect } from "react"

import useToggleState from "@lib/hooks/use-toggle-state"
import { useFormStatus } from "react-dom"

type AccountInfoProps = {
  label: string
  currentInfo: string | React.ReactNode
  isSuccess?: boolean
  isError?: boolean
  errorMessage?: string
  clearState: () => void
  children?: React.ReactNode
  'data-testid'?: string
}

const AccountInfo = ({
  label,
  currentInfo,
  isSuccess,
  isError,
  clearState,
  errorMessage = "An error occurred, please try again",
  children,
  'data-testid': dataTestid
}: AccountInfoProps) => {
  const { state, close, toggle } = useToggleState()

  const { pending } = useFormStatus()

  const handleToggle = () => {
    clearState()
    setTimeout(() => toggle(), 100)
  }

  useEffect(() => {
    if (isSuccess) {
      close()
    }
  }, [isSuccess, close])

  return (
    <div className="text-small-regular" data-testid={dataTestid}>
      <div className="flex items-center justify-between bg-white py-3 px-4 rounded-xl border border-gray-100 shadow-sm transition-all hover:border-gray-200 mb-1">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</span>
          <div className="flex items-center flex-1 basis-0 justify-start gap-x-4">
            {typeof currentInfo === "string" ? (
              <span className="text-sm font-semibold text-gray-800" data-testid="current-info">{currentInfo}</span>
            ) : (
              <div className="text-sm text-gray-800 font-medium">{currentInfo}</div>
            )}
          </div>
        </div>
        <div>
          <Button
            variant="secondary"
            className="rounded-lg px-3 py-1 text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 font-semibold transition-colors shadow-sm h-8"
            onClick={handleToggle}
            type={state ? "reset" : "button"}
            data-testid="edit-button"
            data-active={state}
          >
            {state ? "Cancel" : "Edit"}
          </Button>
        </div>
      </div>

      {/* Success state */}
      <Disclosure>
        <Disclosure.Panel
          static
          className={clx(
            "transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden",
            {
              "max-h-[1000px] opacity-100": isSuccess,
              "max-h-0 opacity-0": !isSuccess,
            }
          )}
          data-testid="success-message"
        >
          <Badge className="p-1.5 my-2 text-xs" color="green">
            <span>{label} updated successfully</span>
          </Badge>
        </Disclosure.Panel>
      </Disclosure>

      {/* Error state  */}
      <Disclosure>
        <Disclosure.Panel
          static
          className={clx(
            "transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden",
            {
              "max-h-[1000px] opacity-100": isError,
              "max-h-0 opacity-0": !isError,
            }
          )}
          data-testid="error-message"
        >
          <Badge className="p-1.5 my-2 text-xs" color="red">
            <span>{errorMessage}</span>
          </Badge>
        </Disclosure.Panel>
      </Disclosure>

      <Disclosure>
        <Disclosure.Panel
          static
          className={clx(
            "transition-[max-height,opacity] duration-300 ease-in-out overflow-visible",
            {
              "max-h-[1000px] opacity-100": state,
              "max-h-0 opacity-0": !state,
            }
          )}
        >
          <div className="flex flex-col gap-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100 mt-1">
            <div className="w-full">{children}</div>
            <div className="flex items-center justify-end mt-2">
              <Button
                isLoading={pending}
                className="rounded-lg px-4 py-1.5 text-xs bg-gray-900 text-white hover:bg-gray-800 font-semibold transition-colors shadow-sm h-8"
                type="submit"
                data-testid="save-button"
              >
                Save changes
              </Button>
            </div>
          </div>
        </Disclosure.Panel>
      </Disclosure>
    </div>
  )
}

export default AccountInfo
