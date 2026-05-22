"use client"

import { Plus } from "@medusajs/icons"
import { Button, Heading } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useActionState } from "react"

import useToggleState from "@lib/hooks/use-toggle-state"
import CountrySelect from "@modules/checkout/components/country-select"
import Input from "@modules/common/components/input"
import Modal from "@modules/common/components/modal"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { HttpTypes } from "@medusajs/types"
import { addCustomerAddress } from "@lib/data/customer"

const AddAddress = ({ region }: { region: HttpTypes.StoreRegion }) => {
  const [successState, setSuccessState] = useState(false)
  const { state, open, close: closeModal } = useToggleState(false)

  const [formState, formAction] = useActionState(addCustomerAddress, {
    success: false,
    error: null,
  })

  const close = () => {
    setSuccessState(false)
    closeModal()
  }

  useEffect(() => {
    if (successState) {
      close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successState])

  useEffect(() => {
    if (formState.success) {
      setSuccessState(true)
    }
  }, [formState])

  return (
    <>
      <button
        className="border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-all rounded-2xl p-6 min-h-[220px] h-full w-full flex flex-col items-center justify-center gap-y-4 group"
        onClick={open}
        data-testid="add-address-button"
      >
        <div className="h-12 w-12 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 group-hover:text-gray-900 group-hover:scale-105 transition-all">
          <Plus />
        </div>
        <span className="text-lg font-semibold text-gray-700 group-hover:text-gray-900">Add New Address</span>
      </button>

      <Modal isOpen={state} close={close} data-testid="add-address-modal">
        <Modal.Title>Add New Address</Modal.Title>
        <form action={formAction}>
          <Modal.Body>
            <div className="flex flex-col gap-y-4 pt-2 max-h-[55vh] overflow-y-auto overflow-x-visible pr-2">
              <div className="grid grid-cols-2 gap-x-4">
                <Input
                  label="First name"
                  name="first_name"
                  required
                  autoComplete="given-name"
                  data-testid="first-name-input"
                />
                <Input
                  label="Last name"
                  name="last_name"
                  required
                  autoComplete="family-name"
                  data-testid="last-name-input"
                />
              </div>

              <Input
                label="Address"
                name="address_1"
                required
                autoComplete="address-line1"
                data-testid="address-1-input"
              />
              <Input
                label="Apartment, suite, etc."
                name="address_2"
                autoComplete="address-line2"
                data-testid="address-2-input"
              />
              <div className="grid grid-cols-[144px_1fr] gap-x-4">
                <Input
                  label="Postal code"
                  name="postal_code"
                  required
                  autoComplete="postal-code"
                  data-testid="postal-code-input"
                />
                <Input
                  label="City"
                  name="city"
                  required
                  autoComplete="locality"
                  data-testid="city-input"
                />
              </div>
              <Input
                label="Province / State"
                name="province"
                autoComplete="address-level1"
                data-testid="state-input"
              />
              <div className="relative">
                <input type="hidden" name="country_code" value="lk" />
                <CountrySelect
                  region={region}
                  required
                  autoComplete="country"
                  data-testid="country-select"
                  disabled
                />
              </div>
              <Input
                label="Phone"
                name="phone"
                autoComplete="phone"
                data-testid="phone-input"
              />
            </div>
            {formState.error && (
              <div
                className="text-red-600 bg-red-50 p-3 rounded-xl mt-4 text-sm font-medium border border-red-100"
                data-testid="address-error"
              >
                {formState.error}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              type="reset"
              variant="secondary"
              onClick={close}
              className="rounded-full px-6 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 font-medium transition-colors"
              data-testid="cancel-button"
            >
              Cancel
            </Button>
            <SubmitButton 
              data-testid="save-button"
              className="rounded-full px-6 py-2 bg-gray-900 text-white hover:bg-gray-800 font-medium transition-colors"
            >
              Save Address
            </SubmitButton>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  )
}

export default AddAddress
