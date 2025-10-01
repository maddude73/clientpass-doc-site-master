import { cn } from '@/lib/utils';

interface ClientPassLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ClientPassLogo = ({ className, size = 'md' }: ClientPassLogoProps) => {
  const sizeClasses: Record<NonNullable<ClientPassLogoProps['size']>, string> = {
    sm: 'w-[120px] h-auto',
    md: 'w-[160px] sm:w-[180px] h-auto',
    lg: 'w-[200px] sm:w-[220px] h-auto',
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <img
        src="/clientpass-logo.png"
        alt="ClientPass - Turn walk-ins into wins"
        className={cn('object-contain', sizeClasses[size])}
        loading="lazy"
      />
    </div>
  );
};