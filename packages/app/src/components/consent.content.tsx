import Link from 'next/link'

export const ConsentContent = () => (
  <div className="flex flex-col gap-3 w-full">
    <span className="font-sora font-medium text-base text-white">
      Cookies & privacidade
    </span>
    <p className="font-roboto text-sm text-[#A2A2A2]">
      Usamos cookies para melhorar sua experiência. Você pode aceitar ou
      recusar. Leia nossa Política de Privacidade e Política de Cookies.
    </p>
    <Link
      className="font-roboto text-sm text-[#447FFD] underline"
      href="/politica-de-privacidade"
    >
      Política de privacidade
    </Link>
  </div>
)
