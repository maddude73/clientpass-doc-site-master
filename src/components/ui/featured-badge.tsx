import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FeaturedBadgeProps {
  className?: string;
  variant?: 'default' | 'small';
}

export const FeaturedBadge = ({ className, variant = 'default' }: FeaturedBadgeProps) => {
  return (
    <Badge 
      className={`bg-yellow-100 text-yellow-800 hover:bg-yellow-100 ${className}`}
      variant="secondary"
    >
      <Star className={`${variant === 'small' ? 'h-3 w-3' : 'h-4 w-4'} mr-1 fill-current`} />
      Featured
    </Badge>
  );
};