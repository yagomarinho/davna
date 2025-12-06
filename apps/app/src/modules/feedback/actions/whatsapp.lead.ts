'use server'

import { string } from 'yup'

import { appendLead } from '../services'

export async function whatsappLead(prev: any, formData: FormData) {
  const phoneRegExp = /^(?:\(\d{2,4}\)|\d{2,4})\s?\d{5}-?\d{4}$/
  const phoneSchema = string()
    .matches(phoneRegExp, 'Phone number is not valid')
    .required()

  try {
    const lead = await phoneSchema.validate(formData.get('whatsapp'))

    await appendLead(lead)

    return
  } catch (e: any) {
    if (e.errors) return { errors: e.errors }

    return {
      errors: [e.message],
    }
  }
}
