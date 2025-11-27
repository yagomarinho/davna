import Image from 'next/image'

export const Logo = () => (
  <div className="relative w-[60px] md:w-[100px] aspect-[5/1]">
    <Image
      src="/logo.png"
      alt="Logomarca Davna representada por 3 waves seguidas do nome Davna"
      fill
    />
  </div>
)
