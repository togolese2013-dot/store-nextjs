import Image from "next/image";

interface Props {
  logoUrl?: string | null;
  siteName: string;
  variant?: "dark" | "light";
  className?: string;
}

/** Renders the shop's uploaded logo, or a text wordmark from the shop name if none is set. */
export default function ShopLogo({ logoUrl, siteName, variant = "dark", className = "h-7 w-auto" }: Props) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={siteName}
        width={160}
        height={40}
        className={className}
        priority
      />
    );
  }

  return (
    <span
      className={`font-display font-bold leading-none tracking-tight truncate max-w-[220px] ${
        variant === "light" ? "text-white" : "text-brand-900"
      } ${className.includes("h-7") ? "text-lg" : "text-base"}`}
    >
      {siteName}
    </span>
  );
}
