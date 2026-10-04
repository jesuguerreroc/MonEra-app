import { getIcon } from '../../constants/icons'

/** Icono dentro de un círculo suave del color de la categoría/cuenta */
export function IconBadge({ icon, color, size = 44 }: { icon: string; color: string; size?: number }) {
  const Icon = getIcon(icon)
  return (
    <span className="grid place-items-center rounded-full shrink-0"
      style={{ width: size, height: size, backgroundColor: `${color}22`, color }}>
      <Icon size={size * 0.46} />
    </span>
  )
}
