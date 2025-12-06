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
      <div className="fixed bg-[#080808] z-10 top-0 left-0 flex flex-row justify-center items-center w-full p-4 md:p-8">
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
