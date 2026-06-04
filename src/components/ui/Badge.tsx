interface BadgeProps {
  color: string
  children: React.ReactNode
  className?: string
}

export function Badge({ color, children, className = '' }: BadgeProps) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}${className ? ` ${className}` : ''}`}>
      {children}
    </span>
  )
}
