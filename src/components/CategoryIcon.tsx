import {
  Car,
  HeartPulse,
  House,
  Landmark,
  Shapes,
  ShoppingBag,
  ShoppingBasket,
  Utensils,
  Wallet,
  Zap,
} from 'lucide-react';

const icons = {
  car: Car,
  'heart-pulse': HeartPulse,
  house: House,
  landmark: Landmark,
  shapes: Shapes,
  'shopping-bag': ShoppingBag,
  'shopping-basket': ShoppingBasket,
  utensils: Utensils,
  wallet: Wallet,
  zap: Zap,
};

export const CategoryIcon = ({ name, size = 18 }: { name: string; size?: number }) => {
  const Icon = icons[name as keyof typeof icons] ?? Shapes;
  return <Icon size={size} aria-hidden="true" />;
};
