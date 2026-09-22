import type { SVGProps } from "react";

type SlashPayBrandProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

export function SlashPayBrand({
  title = "Slash Pay",
  ...props
}: SlashPayBrandProps) {
  return (
    <svg
      viewBox="0 0 480 110"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      {...props}
    >
      <rect width="110" height="110" fill="#0A0A0A" />
      <polygon points="29,99 55,99 88,11 62,11" fill="#FDFCFA" />
      <rect
        x="72"
        y="7"
        width="18"
        height="18"
        transform="rotate(-8 81 16)"
        fill="#FF3D1A"
      />
      <line
        x1="150"
        y1="17"
        x2="150"
        y2="93"
        stroke="#D6D6D2"
        strokeWidth="2"
      />
      <text
        x="183"
        y="73"
        fill="#0A0A0A"
        fontFamily="Arial Black, Arial, sans-serif"
        fontSize="48"
        fontWeight="900"
      >
        SLASH
      </text>
      <text
        x="345"
        y="73"
        fill="#FF3D1A"
        fontFamily="Arial Black, Arial, sans-serif"
        fontSize="48"
        fontWeight="900"
      >
        /
      </text>
      <text
        x="372"
        y="73"
        fill="#0A0A0A"
        fontFamily="Arial Black, Arial, sans-serif"
        fontSize="48"
        fontWeight="900"
      >
        PAY
      </text>
    </svg>
  );
}
