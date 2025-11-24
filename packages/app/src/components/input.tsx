export interface InputProps {
  placeholder?: string
  type?: 'text' | 'password'
  value: string
  onChange: (value: string) => any
}

export const Input = ({
  placeholder,
  type = 'text',
  value,
  onChange,
}: InputProps) => (
  <div className="border border-[#404040] rounded px-4 py-3 bg-[#2c2c2c] w-full">
    <input
      className="outline-none placeholder:text-[#C2C2C2] text-sm bg-transparent w-full"
      placeholder={placeholder}
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  </div>
)
