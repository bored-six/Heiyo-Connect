/**
 * Preset avatar system. Each avatar is a unique illustrated SVG character.
 * Stored in DB as "preset:<id>" in the avatarUrl field.
 */

export const AVATAR_PRESETS = [
  { id: "preset:ocean",  label: "Ocean"  },
  { id: "preset:forest", label: "Forest" },
  { id: "preset:ember",  label: "Ember"  },
  { id: "preset:violet", label: "Violet" },
  { id: "preset:rose",   label: "Rose"   },
  { id: "preset:gold",   label: "Gold"   },
  { id: "preset:indigo", label: "Indigo" },
  { id: "preset:teal",   label: "Teal"   },
  { id: "preset:storm",  label: "Storm"  },
  { id: "preset:coral",  label: "Coral"  },
  { id: "preset:lime",   label: "Lime"   },
  { id: "preset:cyber",  label: "Cyber"  },
] as const

export type AvatarPresetId = (typeof AVATAR_PRESETS)[number]["id"]

export function isPresetAvatar(value: string | null): value is AvatarPresetId {
  return !!value && value.startsWith("preset:")
}

function Base({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
      <circle cx="40" cy="40" r="40" fill={bg} />
      {children}
    </svg>
  )
}

const AVATARS: Record<AvatarPresetId, React.ReactNode> = {
  // ── Ocean — sky blue, wavy hair, calm ───────────────────────────────────
  "preset:ocean": (
    <Base bg="#0ea5e9">
      <path d="M17 37 Q17 9 40 9 Q63 9 63 37" fill="#38bdf8" />
      <ellipse cx="40" cy="52" rx="21" ry="23" fill="#bae6fd" />
      <circle cx="33" cy="49" r="3.5" fill="#0369a1" />
      <circle cx="47" cy="49" r="3.5" fill="#0369a1" />
      <path d="M33 59 Q40 66 47 59" stroke="#0369a1" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </Base>
  ),

  // ── Forest — emerald, glasses, intellectual ──────────────────────────────
  "preset:forest": (
    <Base bg="#10b981">
      <path d="M18 37 Q18 9 40 9 Q62 9 62 37" fill="#34d399" />
      <ellipse cx="40" cy="52" rx="21" ry="23" fill="#a7f3d0" />
      <rect x="25" y="44" width="12" height="9" rx="4.5" fill="none" stroke="#065f46" strokeWidth="2.5" />
      <rect x="43" y="44" width="12" height="9" rx="4.5" fill="none" stroke="#065f46" strokeWidth="2.5" />
      <line x1="37" y1="48.5" x2="43" y2="48.5" stroke="#065f46" strokeWidth="2.5" />
      <path d="M34 59 Q40 65 46 59" stroke="#065f46" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </Base>
  ),

  // ── Ember — orange, spiky hair, energetic ───────────────────────────────
  "preset:ember": (
    <Base bg="#f97316">
      <path
        d="M18 36 L24 18 L29 31 L34 14 L38 28 L40 12 L42 28 L46 14 L51 31 L56 18 L62 36"
        fill="#fb923c" stroke="#fb923c" strokeWidth="2" strokeLinejoin="round"
      />
      <ellipse cx="40" cy="53" rx="21" ry="22" fill="#fed7aa" />
      <circle cx="33" cy="50" r="3.5" fill="#c2410c" />
      <circle cx="47" cy="50" r="3.5" fill="#c2410c" />
      <path d="M33 60 Q40 67 47 60" stroke="#c2410c" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </Base>
  ),

  // ── Violet — purple, top bun, creative ──────────────────────────────────
  "preset:violet": (
    <Base bg="#8b5cf6">
      <path d="M19 37 Q19 14 40 14 Q61 14 61 37" fill="#c4b5fd" />
      <circle cx="40" cy="11" r="11" fill="#c4b5fd" />
      <rect x="36" y="20" width="8" height="7" rx="3" fill="#6d28d9" />
      <ellipse cx="40" cy="52" rx="21" ry="23" fill="#ede9fe" />
      <circle cx="33" cy="49" r="3.5" fill="#5b21b6" />
      <circle cx="47" cy="49" r="3.5" fill="#5b21b6" />
      <path d="M33 59 Q40 66 47 59" stroke="#5b21b6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </Base>
  ),

  // ── Rose — pink, ribbon bow, charming ───────────────────────────────────
  "preset:rose": (
    <Base bg="#f43f5e">
      {/* bow left wing */}
      <path d="M22 17 L37 23 L32 9 Z" fill="#fda4af" />
      <path d="M22 17 L37 23 L37 9 Z" fill="#fb7185" />
      {/* bow right wing */}
      <path d="M58 17 L43 23 L48 9 Z" fill="#fda4af" />
      <path d="M58 17 L43 23 L43 9 Z" fill="#fb7185" />
      {/* bow knot */}
      <circle cx="40" cy="19" r="5" fill="#fda4af" />
      <ellipse cx="40" cy="52" rx="21" ry="23" fill="#ffe4e6" />
      <circle cx="33" cy="49" r="3.5" fill="#be123c" />
      <circle cx="47" cy="49" r="3.5" fill="#be123c" />
      <path d="M33 59 Q40 66 47 59" stroke="#be123c" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </Base>
  ),

  // ── Gold — amber, crown, confident ──────────────────────────────────────
  "preset:gold": (
    <Base bg="#f59e0b">
      {/* crown shape */}
      <path d="M20 30 L20 16 L30 24 L40 10 L50 24 L60 16 L60 30 Z" fill="#fcd34d" />
      {/* crown gems */}
      <circle cx="40" cy="14" r="3.5" fill="#ef4444" />
      <circle cx="27" cy="21" r="2.5" fill="#818cf8" />
      <circle cx="53" cy="21" r="2.5" fill="#818cf8" />
      <ellipse cx="40" cy="53" rx="21" ry="22" fill="#fef3c7" />
      <circle cx="33" cy="50" r="3.5" fill="#92400e" />
      <circle cx="47" cy="50" r="3.5" fill="#92400e" />
      <path d="M33 60 Q40 67 47 60" stroke="#92400e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </Base>
  ),

  // ── Indigo — indigo, long flowing hair, artistic ─────────────────────────
  "preset:indigo": (
    <Base bg="#6366f1">
      {/* top hair */}
      <path d="M18 37 Q18 8 40 8 Q62 8 62 37" fill="#818cf8" />
      {/* side curtains */}
      <rect x="13" y="30" width="10" height="34" rx="5" fill="#818cf8" />
      <rect x="57" y="30" width="10" height="34" rx="5" fill="#818cf8" />
      <ellipse cx="40" cy="51" rx="21" ry="23" fill="#e0e7ff" />
      <circle cx="33" cy="48" r="3.5" fill="#3730a3" />
      <circle cx="47" cy="48" r="3.5" fill="#3730a3" />
      <path d="M33 58 Q40 65 47 58" stroke="#3730a3" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </Base>
  ),

  // ── Teal — teal, flat cap, laid-back ────────────────────────────────────
  "preset:teal": (
    <Base bg="#14b8a6">
      {/* cap body */}
      <path d="M20 30 Q20 10 40 10 Q60 10 60 30 Z" fill="#0f766e" />
      {/* cap brim */}
      <path d="M12 32 Q12 26 20 26 L60 26 Q68 26 68 32 Q68 36 40 36 Q12 36 12 32 Z" fill="#0d9488" />
      {/* cap band highlight */}
      <rect x="20" y="26" width="40" height="4" rx="1" fill="#2dd4bf" />
      <ellipse cx="40" cy="54" rx="21" ry="22" fill="#ccfbf1" />
      <circle cx="33" cy="51" r="3.5" fill="#134e4a" />
      <circle cx="47" cy="51" r="3.5" fill="#134e4a" />
      <path d="M33 61 Q40 68 47 61" stroke="#134e4a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </Base>
  ),

  // ── Storm — slate, short neat hair, professional ─────────────────────────
  "preset:storm": (
    <Base bg="#475569">
      {/* hair block */}
      <path d="M18 37 Q18 10 40 10 Q62 10 62 37 L57 37 Q57 18 40 18 Q23 18 23 37 Z" fill="#64748b" />
      <ellipse cx="40" cy="52" rx="21" ry="23" fill="#f1f5f9" />
      <circle cx="33" cy="49" r="3.5" fill="#1e293b" />
      <circle cx="47" cy="49" r="3.5" fill="#1e293b" />
      {/* smirk */}
      <path d="M36 58 Q41 62 46 58" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* stubble */}
      <circle cx="34" cy="64" r="2" fill="#cbd5e1" />
      <circle cx="40" cy="66" r="2" fill="#cbd5e1" />
      <circle cx="46" cy="64" r="2" fill="#cbd5e1" />
    </Base>
  ),

  // ── Coral — fuchsia, curly hair, warm ───────────────────────────────────
  "preset:coral": (
    <Base bg="#ec4899">
      {/* curly hair mass */}
      <circle cx="22" cy="28" r="11" fill="#f9a8d4" />
      <circle cx="32" cy="18" r="10" fill="#f9a8d4" />
      <circle cx="40" cy="15" r="10" fill="#f9a8d4" />
      <circle cx="48" cy="18" r="10" fill="#f9a8d4" />
      <circle cx="58" cy="28" r="11" fill="#f9a8d4" />
      <ellipse cx="40" cy="53" rx="21" ry="23" fill="#fce7f3" />
      <circle cx="33" cy="50" r="3.5" fill="#9d174d" />
      <circle cx="47" cy="50" r="3.5" fill="#9d174d" />
      <path d="M33 60 Q40 67 47 60" stroke="#9d174d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </Base>
  ),

  // ── Lime — lime green, pigtails, playful ─────────────────────────────────
  "preset:lime": (
    <Base bg="#84cc16">
      {/* left pigtail */}
      <circle cx="16" cy="26" r="11" fill="#bef264" />
      {/* right pigtail */}
      <circle cx="64" cy="26" r="11" fill="#bef264" />
      {/* hair band ties */}
      <rect x="21" y="31" width="9" height="7" rx="3" fill="#4d7c0f" />
      <rect x="50" y="31" width="9" height="7" rx="3" fill="#4d7c0f" />
      {/* top hair */}
      <path d="M23 34 Q23 14 40 14 Q57 14 57 34" fill="#bef264" />
      <ellipse cx="40" cy="52" rx="21" ry="23" fill="#f7fee7" />
      <circle cx="33" cy="49" r="3.5" fill="#365314" />
      <circle cx="47" cy="49" r="3.5" fill="#365314" />
      <path d="M33 59 Q40 66 47 59" stroke="#365314" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </Base>
  ),

  // ── Cyber — cyan, tech headband, sharp ───────────────────────────────────
  "preset:cyber": (
    <Base bg="#06b6d4">
      {/* hair */}
      <path d="M18 35 Q18 9 40 9 Q62 9 62 35" fill="#22d3ee" />
      {/* headband body */}
      <rect x="13" y="28" width="54" height="12" rx="6" fill="#0891b2" />
      {/* tech segments on band */}
      <rect x="24" y="31" width="7" height="6" rx="2" fill="#67e8f9" />
      <rect x="36" y="31" width="8" height="6" rx="2" fill="#67e8f9" />
      <rect x="49" y="31" width="7" height="6" rx="2" fill="#67e8f9" />
      <ellipse cx="40" cy="53" rx="21" ry="22" fill="#cffafe" />
      {/* angular eyes for techy feel */}
      <rect x="29" y="49" width="7" height="6" rx="2" fill="#0e7490" />
      <rect x="44" y="49" width="7" height="6" rx="2" fill="#0e7490" />
      <path d="M34 60 Q40 66 46 60" stroke="#0e7490" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </Base>
  ),
}

/** Renders a preset avatar SVG by its stored ID. */
export function PresetAvatar({ id }: { id: AvatarPresetId }) {
  return <>{AVATARS[id]}</>
}

/** Universal avatar renderer — handles preset IDs, initials fallback. */
export function AvatarDisplay({
  avatarUrl,
  name,
  email,
  size = 40,
  className = "",
}: {
  avatarUrl: string | null
  name: string | null
  email: string
  size?: number
  className?: string
}) {
  const initials = getInitials(name, email)

  if (isPresetAvatar(avatarUrl)) {
    return (
      <div
        className={`rounded-full overflow-hidden shrink-0 select-none ${className}`}
        style={{ width: size, height: size }}
      >
        <PresetAvatar id={avatarUrl} />
      </div>
    )
  }

  return (
    <div
      className={`rounded-full overflow-hidden bg-muted flex items-center justify-center font-bold text-muted-foreground shrink-0 select-none ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.3 }}
    >
      {initials}
    </div>
  )
}

function getInitials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(" ")
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}
