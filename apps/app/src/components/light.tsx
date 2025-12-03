const ASPECT = 1267 / 750

export const Light = () => (
  <svg
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      aspectRatio: ASPECT,
      height: '100vh',
    }}
    viewBox="0 0 1267 750"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#filter0_f_220_387)">
      <path
        d="M368.293 649.198L-148.882 -66.2301L9.27039 -148.152L1166.54 225.228L368.293 649.198Z"
        fill="url(#paint0_linear_220_387)"
        fillOpacity="0.25"
      />
    </g>
    <defs>
      <filter
        id="filter0_f_220_387"
        x="-248.881"
        y="-248.152"
        width="1515.42"
        height="997.35"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="BackgroundImageFix"
          result="shape"
        />
        <feGaussianBlur
          stdDeviation="50"
          result="effect1_foregroundBlur_220_387"
        />
      </filter>
      <linearGradient
        id="paint0_linear_220_387"
        x1="-147.061"
        y1="-112.49"
        x2="436.042"
        y2="710.451"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#385CAA" />
        <stop offset="0.754808" stopColor="#1F325D" />
        <stop offset="1" stopColor="#162544" stopOpacity="0.5" />
      </linearGradient>
    </defs>
  </svg>
)
