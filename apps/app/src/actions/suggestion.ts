'use server'

import { cookies } from 'next/headers'
import { string } from 'yup'

import { appendSuggestion } from '@/services/append.suggestion'
import config from '@/config'

export async function suggestion(prev: any, formData: FormData) {
  const suggestionSchema = string().required()

  const token =
    (await cookies()).get(config.session.token.cookieName)?.value ?? ''

  try {
    const suggestion = await suggestionSchema.validate(
      formData.get('suggestion'),
    )

    await appendSuggestion(suggestion, token)

    return
  } catch (e: any) {
    if (e.errors) return { errors: e.errors }

    return {
      errors: [e.message],
    }
  }
}
