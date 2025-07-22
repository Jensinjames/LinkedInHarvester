import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedCounter from "@/components/ui/animated-counter";
import LoadingCard from "@/components/ui/loading-card";
import AsyncBoundary from "@/components/ui/async-boundary";
import { useErrorRecovery } from "@/hooks/use-error-recovery";
import { memo } from "react";

interface StatsData {
  totalProfiles: number;
  successfulProfiles: number;
  failedProfiles: number;
  successRate: string;
}

// Memoized stat card component for better performance
const StatCard = memo(function StatCard({
  title,
  value,
  icon: Icon,
  bgColor,
  iconColor,
  valueColor,
  index
}: {
  title: string;
  value: number | string;
  icon: any;
  bgColor: string;
  iconColor: string;
  valueColor?: string;
  index: number;
}) {
  const numericValue = typeof value === 'string' ? 
    parseInt(value.replace('%', '')) : value;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4,
        delay: index * 0.1,
        ease: "easeOut"
      }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
    >
      <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <motion.p 
                className="text-sm font-medium text-neutral-gray mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                {title}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                className={`text-3xl font-bold ${valueColor || 'text-text-dark'}`}
              >
                {typeof value === 'string' && value.includes('%') ? (
                  <AnimatedCounter 
                    value={numericValue} 
                    suffix="%" 
                    duration={1000 + index * 200}
                  />
                ) : (
                  <AnimatedCounter 
                    value={numericValue} 
                    duration={1000 + index * 200}
                  />
                )}
              </motion.div>
            </div>
            
            <motion.div 
              className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              transition={{ 
                delay: index * 0.1 + 0.4,
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
              whileHover={{ 
                rotate: 5,
                scale: 1.1,
                transition: { duration: 0.2 }
              }}
            >
              <Icon className={`${iconColor} text-xl`} />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

function StatusOverviewContent() {
  const { executeWithRecovery } = useErrorRecovery({
    maxRetries: 3,
    showToasts: true
  });
  
  const { data: stats, isLoading, error, refetch } = useQuery<StatsData>({
    queryKey: ["/api/stats/overview"],
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      // Use our enhanced error recovery
      return executeWithRecovery(async () => {
        throw error;
      }, 'statistics overview').catch(() => false);
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <LoadingCard key={i} showHeader={false} rows={2} />
        ))}
      </div>
    );
  }

  if (error) {
    throw error; // Let AsyncBoundary handle it
  }

  const statsCards = [
    {
      title: "Total Profiles",
      value: stats?.totalProfiles || 0,
      icon: Users,
      bgColor: "bg-azure-blue bg-opacity-10",
      iconColor: "text-azure-blue",
    },
    {
      title: "Successfully Extracted",
      value: stats?.successfulProfiles || 0,
      icon: CheckCircle,
      bgColor: "bg-success-green bg-opacity-10",
      iconColor: "text-success-green",
      valueColor: "text-success-green",
    },
    {
      title: "Failed Attempts",
      value: stats?.failedProfiles || 0,
      icon: AlertTriangle,
      bgColor: "bg-error-red bg-opacity-10",
      iconColor: "text-error-red",
      valueColor: "text-error-red",
    },
    {
      title: "Success Rate",
      value: stats?.successRate || "0%",
      icon: TrendingUp,
      bgColor: "bg-warning-orange bg-opacity-10",
      iconColor: "text-warning-orange",
    },
  ];

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {statsCards.map((card, index) => (
        <StatCard
          key={card.title}
          {...card}
          index={index}
        />
      ))}
    </motion.div>
  );
}

export default function StatusOverview() {
  return (
    <AsyncBoundary
      context="Status Overview"
      resetKeys={["status-overview"]}
    >
      <StatusOverviewContent />
    </AsyncBoundary>
  );
}
