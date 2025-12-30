import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, formatStr: string = 'dd MMM yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, formatStr, { locale: tr })
}

export function formatRelativeDate(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: tr })
}

export const channelColors: Record<string, string> = {
  email: '#3b82f6',
  sms: '#22c55e',
  meta_ads: '#8b5cf6',
  instagram: '#ec4899',
}

export const channelLabels: Record<string, string> = {
  email: 'Email',
  sms: 'SMS',
  meta_ads: 'Meta Ads',
  instagram: 'Instagram',
}

export const statusColors: Record<string, string> = {
  planned: '#f59e0b',
  in_progress: '#3b82f6',
  completed: '#22c55e',
}

export const statusLabels: Record<string, string> = {
  planned: 'Planlanan',
  in_progress: 'Devam Eden',
  completed: 'Tamamlandı',
}
