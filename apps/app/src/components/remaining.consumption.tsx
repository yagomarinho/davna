import { remainingConsumptionFormat } from '@/utils/remaining.consumption.format'

export interface RemainingConsumptionProps {
  remainingConsumption: number
}

export const RemainingConsumption = ({
  remainingConsumption,
}: RemainingConsumptionProps) => (
  <div className="flex flex-col gap-0 justify-center items-end">
    <span className="font-roboto font-medium text-[8px] text-[#A2A2A2] leading-[100%]">
      Tempo Restante
    </span>
    <span
      style={{
        WebkitTextStroke: '1px #385CAA',
        textShadow: '1px 1px 2px rgba(255,255,255, 0.25)',
      }}
      className="font-grotesk font-bold text-xl text-white leading-[100%]"
    >
      {remainingConsumptionFormat(remainingConsumption)}
    </span>
  </div>
)
