interface ProJuiceLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ProJuiceLogo({ className = "", size = "md" }: ProJuiceLogoProps) {
  const sizes = { sm: "h-8", md: "h-12", lg: "h-16" };
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        className={`${sizes[size]} w-auto`}
        viewBox="0 0 120 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="120" height="40" rx="6" fill="#ea580c" />
        <text
          x="60"
          y="27"
          textAnchor="middle"
          fill="white"
          fontSize="16"
          fontWeight="bold"
          fontFamily="system-ui, sans-serif"
          letterSpacing="0.5"
        >
          ProJuice
        </text>
      </svg>
    </div>
  );
}
