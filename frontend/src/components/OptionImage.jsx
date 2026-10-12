import { resolveImageUrl } from '../utils/imageUrl.js'

export default function OptionImage({ src }) {
  if (!src) return null
  return <img src={resolveImageUrl(src)} alt="" loading="lazy" className="mt-2 block max-h-48 max-w-full rounded-lg border border-slate-200 bg-slate-50 object-contain" />
}
