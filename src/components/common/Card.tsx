interface CardProps {
  children: React.ReactNode
  className?: string
  as?: 'article' | 'aside' | 'div' | 'section'
}

const baseClassName = 'rounded-card border border-gray-200 bg-white p-4'

export default function Card({
  children,
  className = '',
  as = 'section',
}: CardProps) {
  const Component = as
  const classNames = [baseClassName, className].filter(Boolean).join(' ')

  return <Component className={classNames}>{children}</Component>
}
