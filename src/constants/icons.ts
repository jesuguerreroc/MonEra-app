import {
  Utensils, Car, Home, Zap, ShoppingBag, Film, HeartPulse, GraduationCap, Repeat, Laptop, Plane,
  CircleEllipsis, Wallet, Briefcase, Store, Gift, Tag, Banknote, Landmark, PiggyBank, CreditCard, Coins,
  Coffee, Dumbbell, PawPrint, Baby, Shirt, Music, Gamepad2, Wrench, Smartphone,
  type LucideIcon,
} from 'lucide-react'

export const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils, car: Car, home: Home, zap: Zap, 'shopping-bag': ShoppingBag, film: Film,
  'heart-pulse': HeartPulse, 'graduation-cap': GraduationCap, repeat: Repeat, laptop: Laptop, plane: Plane,
  ellipsis: CircleEllipsis, wallet: Wallet, briefcase: Briefcase, store: Store, gift: Gift, tag: Tag,
  banknote: Banknote, landmark: Landmark, 'piggy-bank': PiggyBank, 'credit-card': CreditCard, coins: Coins,
  coffee: Coffee, dumbbell: Dumbbell, 'paw-print': PawPrint, baby: Baby, shirt: Shirt, music: Music,
  gamepad: Gamepad2, wrench: Wrench, smartphone: Smartphone,
}

export function getIcon(name: string): LucideIcon {
  return ICONS[name] ?? Tag
}

export const CATEGORY_ICON_KEYS = [
  'utensils', 'car', 'home', 'zap', 'shopping-bag', 'film', 'heart-pulse', 'graduation-cap', 'repeat',
  'laptop', 'plane', 'coffee', 'dumbbell', 'paw-print', 'baby', 'shirt', 'music', 'gamepad', 'wrench',
  'briefcase', 'store', 'gift', 'banknote', 'coins', 'tag',
]
export const ACCOUNT_ICON_KEYS = ['landmark', 'smartphone', 'wallet', 'credit-card', 'piggy-bank', 'banknote', 'coins']
