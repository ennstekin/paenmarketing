import { Mail, MessageSquare, Megaphone, Instagram } from 'lucide-react'
import type { ChannelType } from '@/types/database'
import { channelColors } from '@/lib/utils'

interface ChannelIconProps {
  channel: ChannelType
  className?: string
}

export function ChannelIcon({ channel, className = 'h-4 w-4' }: ChannelIconProps) {
  const color = channelColors[channel]

  const icons: Record<ChannelType, React.ReactNode> = {
    email: <Mail className={className} style={{ color }} />,
    sms: <MessageSquare className={className} style={{ color }} />,
    meta_ads: <Megaphone className={className} style={{ color }} />,
    instagram: <Instagram className={className} style={{ color }} />,
  }

  return icons[channel]
}
