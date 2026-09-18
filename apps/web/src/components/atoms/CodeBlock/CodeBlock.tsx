interface CodeBlockProps {
  code: string
  label?: string
}

/**
 * The scroll container is focusable and named: a scrollable region that a
 * keyboard user cannot reach fails WCAG 2.1.1.
 */
export function CodeBlock({ code, label = 'Código' }: CodeBlockProps) {
  return (
    <pre
      tabIndex={0}
      role="region"
      aria-label={label}
      className="max-h-96 overflow-auto rounded-lg bg-surface p-4 font-mono text-sm text-offwhite focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
    >
      <code>{code}</code>
    </pre>
  )
}
