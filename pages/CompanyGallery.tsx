// components/CompanyGallery.tsx
import { useEffect, useState } from "react";

interface CompanySlot {
  name: string;
  images: string[];
}

export default function CompanyGallery() {
  const [companies, setCompanies] = useState<CompanySlot[]>([]);

  useEffect(() => {
    // ⚠️  client-side only
    if (typeof window === "undefined") return;

    // every localStorage entry that parses as JSON array becomes a slot
    const slots: CompanySlot[] = Object.entries(localStorage)
      .map(([key, value]) => {
        try {
          const arr = JSON.parse(value);
          return Array.isArray(arr) ? { name: key, images: arr } : null;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as CompanySlot[];

    setCompanies(slots);
  }, []);

  if (companies.length === 0)
    return (
      <p className="text-slate-400 text-center">
        No saved companies yet – process a bill first.
      </p>
    );

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {companies.map(({ name, images }) => (
        <div
          key={name}
          className="bg-slate-800 rounded-xl p-5 border border-slate-700"
        >
          <h4 className="text-white font-semibold mb-4">{name}</h4>

          <div className="flex flex-wrap gap-3">
            {images.slice(-4).map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`${name}-${i}`}
                className="w-24 h-16 object-cover rounded border border-slate-700"
              />
            ))}

            {images.length > 4 && (
              <div className="w-24 h-16 flex items-center justify-center rounded border border-slate-700 text-xs text-slate-400">
                +{images.length - 4} more
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
