import { Card, CardContent, CardHeader } from "./card";
import { Skeleton } from "./skeleton";

interface LoadingCardProps {
  showHeader?: boolean;
  rows?: number;
  className?: string;
}

export default function LoadingCard({ 
  showHeader = true, 
  rows = 3,
  className 
}: LoadingCardProps) {
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}