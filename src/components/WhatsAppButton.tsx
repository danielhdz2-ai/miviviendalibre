'use client'

export default function WhatsAppButton() {
  const phone = '34641008847'
  const message = encodeURIComponent(
    'Hola Inmonest, estoy interesado en recibir información sobre vuestros servicios inmobiliarios.'
  )
  const href = `https://wa.me/${phone}?text=${message}`

  return (
    <>
      <style>{`
        @keyframes wa-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37,211,102,0.5); }
          50% { box-shadow: 0 0 0 12px rgba(37,211,102,0); }
        }
        .wa-pulse { animation: wa-pulse 2s ease-in-out infinite; }
      `}</style>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        className="wa-pulse fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25d366] shadow-lg hover:bg-[#1ebe5d] transition-colors"
      >
        <svg viewBox="0 0 32 32" width="30" height="30" fill="white" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M16.004 2.667C8.64 2.667 2.667 8.64 2.667 16c0 2.37.632 4.588 1.733 6.51L2.667 29.333l6.988-1.712A13.267 13.267 0 0016.004 29.333C23.36 29.333 29.333 23.36 29.333 16S23.36 2.667 16.004 2.667zm0 2.4c6.034 0 10.93 4.896 10.93 10.933 0 6.035-4.896 10.933-10.93 10.933a10.892 10.892 0 01-5.618-1.558l-.4-.238-4.148 1.016.98-3.99-.26-.42A10.893 10.893 0 015.074 16c0-6.037 4.896-10.933 10.93-10.933zm-3.55 5.866c-.266 0-.7.1-.978.4-.276.3-1.056 1.033-1.056 2.52s1.082 2.928 1.232 3.128c.15.2 2.12 3.235 5.14 4.54.72.31 1.28.494 1.718.634.72.228 1.376.196 1.894.118.58-.088 1.782-.728 2.032-1.432.25-.704.25-1.308.176-1.434-.074-.124-.274-.2-.574-.35s-1.782-.88-2.058-.98c-.276-.1-.476-.15-.676.15-.2.3-.774.978-.95 1.178-.174.2-.35.226-.65.076-.3-.15-1.268-.468-2.414-1.49-.892-.794-1.494-1.774-1.67-2.074-.176-.3-.018-.462.132-.61.134-.134.3-.35.45-.524.15-.176.2-.3.3-.5.1-.2.05-.374-.026-.524-.075-.15-.676-1.634-.926-2.234-.244-.584-.492-.504-.676-.512-.174-.008-.374-.01-.574-.01z"/>
        </svg>
      </a>
    </>
  )
}
