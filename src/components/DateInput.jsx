import { useRef } from 'react'

export function DateInput({ value, onChange }) {
  const ref = useRef()

  if (!value) return (
    <span className="date-input-empty" onClick={() => ref.current?.showPicker?.() || ref.current?.focus()}>
      Set date
      <input
        ref={ref}
        type="date"
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
        onChange={e => onChange(e.target.value)}
      />
    </span>
  )

  return (
    <input
      type="date"
      className="date-input"
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  )
}
