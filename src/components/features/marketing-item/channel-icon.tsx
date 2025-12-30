import { Mail, MessageSquare, Megaphone, Instagram, Send, Radio, Tv, Globe, Phone } from 'lucide-react'

interface ChannelIconProps {
  icon?: string
  color?: string
  className?: string
}

const iconComponents: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  'mail': Mail,
  'message-square': MessageSquare,
  'megaphone': Megaphone,
  'instagram': Instagram,
  'send': Send,
  'radio': Radio,
  'tv': Tv,
  'globe': Globe,
  'phone': Phone,
}

export function ChannelIcon({ icon = 'mail', color, className = 'h-4 w-4' }: ChannelIconProps) {
  const IconComponent = iconComponents[icon] || Mail
  return <IconComponent className={className} style={color ? { color } : undefined} />
}
