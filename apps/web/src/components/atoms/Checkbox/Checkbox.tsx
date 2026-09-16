import type { InputHTMLAttributes } from 'react'

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export function Checkbox({ className, children, ...props }: CheckboxProps) {
  return (
    <label
      className={[
        'inline-flex items-center gap-2 text-sm text-offwhite',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          className="peer h-5 w-5 shrink-0 appearance-none rounded border border-muted bg-surface checked:border-primary checked:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          {...props}
        />
        <svg
          viewBox="0 0 16 16"
          className="pointer-events-none absolute hidden h-3 w-3 text-surface peer-checked:block"
          aria-hidden="true"
        >
          <path
            d="M3 8l3 3 7-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </span>
      {children}
    </label>
  )
}
