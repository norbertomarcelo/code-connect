interface DividerProps {
  label?: string
}

export function Divider({ label }: DividerProps) {
  if (!label) {
    return <hr className="border-muted/40" />
  }

  return (
    <div className="flex items-center gap-4 text-sm text-muted">
      <hr className="flex-1 border-muted/40" />
      <span>{label}</span>
      <hr className="flex-1 border-muted/40" />
    </div>
  )
}
