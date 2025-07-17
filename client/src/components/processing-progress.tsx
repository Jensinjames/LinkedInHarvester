import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ProcessingStatus {
  fileName: string;
  status: 'active' | 'paused' | 'completed';
  progress: {
    percentage: number;
    processed: number;
    total: number;
    successful: number;
    retrying: number;
    failed: number;
    remaining: number;
    eta: string;
    rate: string;
  };
}

export default function ProcessingProgress() {
  const { data: processingStatus } = useQuery<ProcessingStatus>({
    queryKey: ["/api/jobs/current-status"],
    refetchInterval: 5000, // Poll every 5 seconds
  });

  if (!processingStatus) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-text-dark">
            Current Processing Status
          </h3>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-neutral-gray">
            No active processing jobs
          </div>
        </CardContent>
      </Card>
    );
  }

  const { progress } = processingStatus;
  const statusColor = processingStatus.status === 'active' ? 'text-azure-blue' : 
                     processingStatus.status === 'paused' ? 'text-warning-orange' : 
                     'text-success-green';

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-dark">
            Current Processing Status
          </h3>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-azure-blue bg-opacity-10 ${statusColor}`}>
            {processingStatus.status === 'active' && (
              <span className="w-2 h-2 bg-azure-blue rounded-full mr-2 animate-pulse"></span>
            )}
            {processingStatus.status.charAt(0).toUpperCase() + processingStatus.status.slice(1)}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-neutral-gray">{processingStatus.fileName}</span>
              <span className="text-text-dark font-medium">
                {progress.percentage}% ({progress.processed.toLocaleString()}/{progress.total.toLocaleString()})
              </span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-success-green">
                {progress.successful.toLocaleString()}
              </p>
              <p className="text-xs text-neutral-gray">Successful</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-warning-orange">
                {progress.retrying.toLocaleString()}
              </p>
              <p className="text-xs text-neutral-gray">Retrying</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-error-red">
                {progress.failed.toLocaleString()}
              </p>
              <p className="text-xs text-neutral-gray">Failed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-gray">
                {progress.remaining.toLocaleString()}
              </p>
              <p className="text-xs text-neutral-gray">Remaining</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 text-sm text-neutral-gray">
            <span>
              Estimated completion: <span className="font-medium">{progress.eta}</span>
            </span>
            <span>
              Rate: <span className="font-medium">{progress.rate}</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
