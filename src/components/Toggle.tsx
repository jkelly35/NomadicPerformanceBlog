import React from 'react'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  icon?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function Toggle({
  checked,
  onChange,
  label,
  icon,
  disabled = false,
  size = 'md'
}: ToggleProps) {
  const sizeClasses = {
    sm: {
      container: 'h-6 w-10',
      circle: 'h-4 w-4',
      translate: 'translate-x-4',
      text: 'text-sm'
    },
    md: {
      container: 'h-7 w-12',
      circle: 'h-5 w-5',
      translate: 'translate-x-5',
      text: 'text-base'
    },
    lg: {
      container: 'h-8 w-14',
      circle: 'h-6 w-6',
      translate: 'translate-x-6',
      text: 'text-lg'
    }
  }

  const classes = sizeClasses[size]

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-all duration-200 group">
      <div className="flex items-center gap-3">
        {icon && <span className="text-xl">{icon}</span>}
        <span className={`font-medium text-gray-800 ${classes.text}`}>{label}</span>
      </div>

      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`
          relative inline-flex ${classes.container} flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
          transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${checked ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-200'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block ${classes.circle} rounded-full bg-white shadow-lg
            transform ring-0 transition-all duration-300 ease-in-out
            ${checked ? classes.translate : 'translate-x-0.5'}
          `}
        />
      </button>
    </div>
  )
}
