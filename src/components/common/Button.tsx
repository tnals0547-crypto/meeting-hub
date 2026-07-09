import Link from 'next/link'
import { Loader2, Check } from 'lucide-react'

interface ButtonProps {
  children: React.ReactNode
  href?: string
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  success?: boolean
  type?: 'button' | 'submit'
  className?: string
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
}

const variantStyles: Record<string, string> = {
  primary:
    'h-11 rounded-[8px] bg-brand-500 px-5 text-base font-medium text-white transition-all hover:bg-brand-600 active:bg-brand-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400',
  secondary:
    'h-9 rounded-[8px] border border-gray-200 bg-white px-4 text-body-sm font-medium text-gray-700 transition-all hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50',
  danger:
    'h-11 rounded-[8px] bg-red-500 px-5 text-base font-medium text-white transition-all hover:bg-red-600 active:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400',
  ghost:
    'h-9 rounded-[8px] px-4 text-body-sm font-medium text-gray-600 transition-all hover:bg-gray-100 active:bg-gray-200',
}

export default function Button({
  children,
  href,
  onClick,
  disabled = false,
  loading = false,
  success = false,
  type = 'button',
  className = '',
  variant = 'primary',
}: ButtonProps) {
  const classNames = [
    'inline-flex items-center justify-center',
    'transition-all duration-150',
    variantStyles[variant],
    'select-none',
    loading && 'relative text-transparent',
    success && 'bg-green-500 hover:bg-green-600 active:bg-green-700 border-green-500 text-white',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      {children}
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center text-white">
          <Loader2 className="h-5 w-5 animate-spin" />
        </span>
      )}
      {success && (
        <span className="ml-1.5">
          <Check className="h-4 w-4" />
        </span>
      )}
    </>
  )

  if (href) {
    return (
      <Link href={href} className={classNames}>
        {content}
      </Link>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      type={type}
      className={classNames}
    >
      {content}
    </button>
  )
}