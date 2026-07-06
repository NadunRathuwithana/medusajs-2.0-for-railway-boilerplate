import { AlertCircle } from "lucide-react"

const ErrorMessage = ({ error, 'data-testid': dataTestid }: { error?: string | null, 'data-testid'?: string }) => {
  if (!error) {
    return null
  }

  // Remove generic prefix if present to make it more polite
  const cleanError = error.replace("Error setting up the request: ", "")

  return (
    <div className="mt-3 flex items-start gap-x-2.5 rounded-xl bg-orange-50 p-3 border border-orange-100" data-testid={dataTestid}>
      <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-[13px] text-orange-800 leading-relaxed font-medium">
          {cleanError}
        </p>
      </div>
    </div>
  )
}

export default ErrorMessage
