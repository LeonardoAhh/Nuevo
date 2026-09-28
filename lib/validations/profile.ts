import { z } from 'zod'

export const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name too long'),
  email: z.string().email('Invalid email address'),
  language: z.string().min(1, 'Language is required'),
  dateFormat: z.string().min(1, 'Date format is required'),
})

export const skillSchema = z.object({
  skill: z.string()
    .min(1, 'Skill name is required')
    .max(50, 'Skill name too long')
    .regex(/^[a-zA-Z0-9\s\-\+\#\.\(\)]+$/, 'Skill name contains invalid characters'),
})

export type ProfileFormData = z.infer<typeof profileSchema>
export type SkillFormData = z.infer<typeof skillSchema>
