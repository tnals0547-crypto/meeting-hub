import Link from 'next/link'

interface ButtonProps {
  children: React.ReactNode
  href?: string
  onClick?: () => void
  className?: string
}

const baseClass =
  'inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-black/80'

export default function Button({ children, href, onClick, className = '' }: ButtonProps) {
  const classNames = [baseClass, className].filter(Boolean).join(' ')

  if (href) {
    return (
      <Link href={href} className={classNames}>
        {children}
      </Link>
    )
  }

  return (
    <button onClick={onClick} className={classNames}>
      {children}
    </button>
  )
}
