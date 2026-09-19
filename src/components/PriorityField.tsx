import { PRIORITY_META } from '../lib/priority'
import { PRIORITIES } from '../lib/tasks'
import type { Priority } from '../types'
import { Seal } from './Seal'

interface PriorityFieldProps {
  name: string
  value: Priority
  onChange: (priority: Priority) => void
  legend?: string
  className?: string
}

/** Radio group for choosing High, Medium or Low. Native inputs keep it keyboard and screen reader friendly. */
export function PriorityField({ name, value, onChange, legend = 'Priority', className }: PriorityFieldProps) {
  return (
    <fieldset className={className}>
      <legend className="field-label max-sm:sr-only">{legend}</legend>
      <div className="seg w-full">
        {PRIORITIES.map((priority) => {
          const meta = PRIORITY_META[priority]
          return (
            <label key={priority}>
              <input
                type="radio"
                className="sr-only"
                name={name}
                value={priority}
                checked={value === priority}
                onChange={() => onChange(priority)}
              />
              <Seal tone={meta.tone}>{meta.kanji}</Seal>
              <span>{meta.label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
