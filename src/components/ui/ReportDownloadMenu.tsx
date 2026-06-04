import { useEffect, useRef, useState } from 'react'
import { notify } from '../../lib/toast'

export interface ReportDownloadOption {
  label: string
  description?: string
  action: () => Promise<void>
}

interface ReportDownloadMenuProps {
  options: ReportDownloadOption[]
  label?: string
  disabled?: boolean
  disabledLabel?: string
}

export function ReportDownloadMenu({
  options,
  label = 'Descargar reportes',
  disabled = false,
  disabledLabel = 'Reportes no disponibles',
}: ReportDownloadMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState('')

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  const handleDownload = async (option: ReportDownloadOption) => {
    setLoading(option.label)
    try {
      await option.action()
      notify.success(`${option.label} descargado`)
      setOpen(false)
    } catch (error) {
      notify.apiError(error)
    } finally {
      setLoading('')
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={!!loading || disabled}
        title={disabled ? disabledLabel : label}
        className="border border-gray-300 text-gray-700 bg-white px-3 md:px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2 shrink-0 transition-colors"
      >
        <span aria-hidden="true">↓</span>
        <span className="hidden sm:inline">{loading || label}</span>
        <span className="sm:hidden">Reportes</span>
        <span className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          {options.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => handleDownload(option)}
              disabled={!!loading}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <span className="block text-sm font-medium text-gray-800">{option.label}</span>
              {option.description && (
                <span className="block text-xs text-gray-500 mt-0.5">{option.description}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
