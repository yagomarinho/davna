export interface RemainingConsumptionProps {
  remainingConsumption: number
}

const MINUTES_TIME_IN_SECONDS = 60
const HOUR_TIME_IN_SECONDS = 60 * MINUTES_TIME_IN_SECONDS

function padTime(time: number) {
  return time.toString().padStart(2, '0')
}

function format(remaining: number) {
  const totalSeconds = remaining / 1000

  const hours = Math.floor(totalSeconds / HOUR_TIME_IN_SECONDS)

  const minutes = Math.floor(
    (totalSeconds - hours * HOUR_TIME_IN_SECONDS) / MINUTES_TIME_IN_SECONDS,
  )

  const seconds = Math.floor(
    totalSeconds -
      (hours * HOUR_TIME_IN_SECONDS + minutes * MINUTES_TIME_IN_SECONDS),
  )

  return `${padTime(hours)}:${padTime(minutes)}:${padTime(seconds)}`
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
      {format(remainingConsumption)}
    </span>
  </div>
)
