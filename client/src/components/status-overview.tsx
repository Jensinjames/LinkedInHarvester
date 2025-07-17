import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";

interface StatsData {
  totalProfiles: number;
  successfulProfiles: number;
  failedProfiles: number;
  successRate: string;
}

export default function StatusOverview() {
  const { data: stats, isLoading } = useQuery<StatsData>({
    queryKey: ["/api/stats/overview"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsCards.map((card, index) => (
        <Card key={index} className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-gray">
                  {card.title}
                </p>
                <p 
                  className={`text-3xl font-bold ${
                    card.valueColor || 'text-text-dark'
                  }`}
                >
                  {card.value.toLocaleString()}
                </p>
              </div>
              <div 
                className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}
              >
                <card.icon className={`${card.iconColor} text-xl`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
