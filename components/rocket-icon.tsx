"use client"

// next/image does not prefix basePath when images are unoptimized, so do it here.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ""

export function RocketIcon({ className }: { className?: string }) {
  return (
    <img
      src={`${BASE_PATH}/rocket-logo.svg`}
      alt=""
      aria-hidden="true"
      width={32}
      height={32}
      className={className}
    />
  )
}
