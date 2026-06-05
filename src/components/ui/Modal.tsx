import type { ReactNode } from 'react'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  sheet?: boolean
}

const sizeClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-2xl',
  '2xl': 'sm:max-w-4xl',
}

export function Modal({ title, onClose, children, size = 'md', sheet = true }: ModalProps) {
  return (
    <div className={`fixed inset-0 bg-black/50 flex justify-center ${sheet ? 'items-end sm:items-center' : 'items-center'} z-50 sm:p-4`}>
      <div className={`bg-white ${sheet ? 'rounded-t-2xl sm:rounded-2xl' : 'rounded-2xl'} w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col overflow-hidden`}>
        <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-gray-200 flex items-center justify-between shrink-0">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
