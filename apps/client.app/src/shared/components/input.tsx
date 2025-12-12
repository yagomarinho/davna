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
  <div className="flex flex-row justify-center items-center gap-0 w-full max-w-sm md:max-w-lg max-h-11 bg-[#121212] rounded-full border border-[#2c2c2c]">
    <input
      className="px-4 md:px-6 py-3 md:py-4 font-roboto text-xs md:text-base w-full bg-transparent placeholder:text-[#727272] outline-none"
      placeholder={placeholder}
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  </div>
)
