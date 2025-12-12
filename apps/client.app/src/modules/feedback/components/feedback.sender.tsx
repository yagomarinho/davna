'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { FiSend } from 'react-icons/fi'

import { InlineNotification } from '@/shared/components'

interface Init<T = any> {
  name: string
  action: (state: T, formData: FormData) => any
  placeholder: string
  errorMessage: string
}

export const FeedbackSender = ({
  action,
  errorMessage,
  name,
  placeholder,
}: Init) => {
  const { pending } = useFormStatus()
  const [state, formAction] = useActionState(action, undefined)

  return (
    <div className="flex flex-col justify-start items-center w-full max-w-sm md:max-w-lg">
      <form
        style={{
          borderColor: state?.errors ? '#972B38' : 'rgba(44, 44, 44, 0.15)',
        }}
        action={formAction}
        className="flex flex-row justify-center items-center gap-0 w-full max-h-11 md:max-h-14 bg-[#121212] rounded-full border"
      >
        <input
          name={name}
          className="px-4 md:px-6 py-3 md:py-4 font-roboto text-xs md:text-base w-full bg-transparent placeholder:text-[#727272] outline-none"
          placeholder={placeholder}
        />
        <button
          disabled={pending}
          className="flex justify-center items-center rounded-full w-full max-w-11 md:max-w-14 aspect-[1/1] bg-[#385CAA]"
          type="submit"
        >
          <FiSend />
        </button>
      </form>
      {state?.errors && (
        <div className="w-full max-w-md mt-3">
          <InlineNotification type="error" message={errorMessage} initial />
        </div>
      )}
    </div>
  )
}
