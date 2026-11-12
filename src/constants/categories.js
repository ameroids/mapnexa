// Business / Industry Categories with Unique Colors for Map Pins and Badges
export const CATEGORIES = [
  {
    key: 'Paver block manufacturer',
    label: 'Paver block manufacturer',
    color: '#8B5CF6', // Purple / Violet
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    ring: 'ring-purple-500',
    dot: 'bg-purple-500',
    radar: 'rgba(139, 92, 246, 0.45)',
  },
  {
    key: 'Fly ash bricks manufacturer',
    label: 'Fly ash bricks manufacturer',
    color: '#EF4444', // Red
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    ring: 'ring-rose-500',
    dot: 'bg-rose-500',
    radar: 'rgba(239, 68, 68, 0.45)',
  },
  {
    key: 'Waterproofing applicator',
    label: 'Waterproofing applicator',
    color: '#06B6D4', // Cyan
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    ring: 'ring-cyan-500',
    dot: 'bg-cyan-500',
    radar: 'rgba(6, 182, 212, 0.45)',
  },
  {
    key: 'Water proofing chemicals trader',
    label: 'Water proofing chemicals trader',
    color: '#F59E0B', // Amber / Orange
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    ring: 'ring-amber-500',
    dot: 'bg-amber-500',
    radar: 'rgba(245, 158, 11, 0.45)',
  },
  {
    key: 'Tiles applicator',
    label: 'Tiles applicator',
    color: '#10B981', // Emerald Green
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    ring: 'ring-emerald-500',
    dot: 'bg-emerald-500',
    radar: 'rgba(16, 185, 129, 0.45)',
  },
  {
    key: 'Paint manufacturer',
    label: 'Paint manufacturer',
    color: '#EC4899', // Pink / Rose
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-200',
    ring: 'ring-pink-500',
    dot: 'bg-pink-500',
    radar: 'rgba(236, 72, 153, 0.45)',
  },
  {
    key: 'Builder',
    label: 'Builder',
    color: '#3B82F6', // Royal Blue
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    ring: 'ring-blue-500',
    dot: 'bg-blue-500',
    radar: 'rgba(59, 130, 246, 0.45)',
  },
];

export const DEFAULT_CATEGORY = CATEGORIES[0]; // Paver block manufacturer

export const getCategoryMeta = (catKey) => {
  if (!catKey) return null;
  const k = String(catKey).trim().toLowerCase();
  return (
    CATEGORIES.find((c) => c.key.toLowerCase() === k || c.label.toLowerCase() === k) || {
      key: catKey,
      label: catKey,
      color: '#6366F1', // Indigo fallback
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      ring: 'ring-indigo-500',
      dot: 'bg-indigo-500',
      radar: 'rgba(99, 102, 241, 0.45)',
    }
  );
};
