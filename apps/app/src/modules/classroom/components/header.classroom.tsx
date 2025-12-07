'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { FiArrowLeft } from 'react-icons/fi'

import { BaseHeader, Button } from '@/shared/components'

import { RemainingConsumption } from './remaining.consumption'
import { useClassroom } from '../contexts'

export const ClassroomHeader = () => {
  const { getRemaining } = useClassroom()

  const remaining = useMemo(() => getRemaining(), [getRemaining])

  return (
    <BaseHeader>
      <div className="fixed bg-[#1D1D1D] z-10 top-0 left-0 flex flex-row justify-center items-center w-full h-[76px] p-4 md:p-8 border-b border-[#ffffff]/25 shadow-[0_4px_8px_rgba(0,0,0,0.65)]">
        <div className="flex flex-row justify-between items-center w-full max-w-screen-md">
          <Link href="/dashboard">
            <Button type="ghost">
              <FiArrowLeft size={18} strokeWidth={2} />
              <span className="font-sora font-medium text-sm ml-2">Sair</span>
            </Button>
          </Link>
          <RemainingConsumption remainingConsumption={remaining} />
        </div>
      </div>
    </BaseHeader>
  )
}
