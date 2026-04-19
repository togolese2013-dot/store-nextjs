"use client";

interface Props {
  number: string;
}

export default function WhatsAppButton({ number }: Props) {
  // Normalize: keep digits only
  const clean = number.replace(/\D/g, "");
  const href  = `https://wa.me/${clean}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Nous contacter sur WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"
      style={{ backgroundColor: "#25D366" }}
    >
      {/* WhatsApp SVG icon */}
      <svg viewBox="0 0 32 32" className="w-7 h-7 fill-white" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.004 2C8.28 2 2 8.278 2 16a13.93 13.93 0 001.9 7.01L2 30l7.18-1.88A13.96 13.96 0 0016.004 30C23.72 30 30 23.722 30 16S23.72 2 16.004 2zm0 25.455a11.52 11.52 0 01-5.877-1.605l-.42-.25-4.262 1.117 1.135-4.143-.274-.435A11.453 11.453 0 014.545 16c0-6.32 5.14-11.455 11.459-11.455C22.32 4.545 27.455 9.68 27.455 16c0 6.32-5.135 11.455-11.451 11.455zm6.285-8.575c-.345-.172-2.04-1.006-2.356-1.12-.316-.115-.546-.172-.776.172-.23.345-.89 1.12-1.09 1.35-.2.23-.4.258-.745.086-.345-.172-1.456-.537-2.773-1.711-1.025-.913-1.717-2.04-1.917-2.385-.2-.345-.021-.531.15-.702.155-.155.345-.4.518-.6.172-.2.23-.345.345-.575.115-.23.057-.43-.029-.602-.086-.172-.776-1.87-1.063-2.56-.28-.673-.563-.582-.776-.593l-.66-.012c-.23 0-.603.086-.918.43-.316.345-1.204 1.177-1.204 2.87s1.232 3.33 1.404 3.56c.172.23 2.426 3.704 5.877 5.193.822.354 1.463.566 1.963.724.824.262 1.574.225 2.168.137.661-.099 2.04-.834 2.327-1.638.287-.804.287-1.493.2-1.638-.086-.143-.315-.23-.66-.4z"/>
      </svg>
    </a>
  );
}
