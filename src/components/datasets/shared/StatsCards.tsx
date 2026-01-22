import { Card } from '@/components/ui/card';

interface StatCardData {
  value: number;
  label: string;
  color: string;
}

interface StatsCardsProps {
  stats: StatCardData[];
  tokens: any;
  isDark?: boolean;
}

export function StatsCards({ stats, tokens, isDark = false }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="p-4"
          style={{
            background: tokens.surfaceCard,
            borderColor: tokens.borderDefault,
          }}
        >
          <div className="text-2xl font-bold mb-1" style={{ color: stat.color }}>
            {stat.value}
          </div>
          <div className="text-xs" style={{ color: tokens.textSecondary }}>
            {stat.label}
          </div>
        </Card>
      ))}
    </div>
  );
}
