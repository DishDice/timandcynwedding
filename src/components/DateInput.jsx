import { useRef } from 'react'

export function DateInput({ value, onChange }) {
  const ref = useRef()

  if (!value) return (
    <button
      type="button"
      className="date-input-empty"
      onClick={() => ref.current?.showPicker?.() || ref.current?.focus()}
    >
      Set date
      <input
        ref={ref}
        type="date"
        className="date-input-hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={e => onChange(e.target.value)}
      />
    </button>
  )

  return (
    <input
      type="date"
      className="date-input"
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-label="Due date"
    />
  )
}
