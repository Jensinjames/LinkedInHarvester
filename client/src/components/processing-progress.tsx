import { useJobProcessing } from "@/hooks/use-job-processing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Pause, Play, Square, Clock, Activity, AlertCircle } from "lucide-react";

export default function ProcessingProgress() {
  const {
    hasActiveJob,
    currentJob,
    isLoading,
    error,
    pauseJob,
    resumeJob,
    cancelJob,
    isPausing,
    isResuming,
    isCancelling,
  } = useJobProcessing();

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span>Processing Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load job status. Please refresh the page.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-text-light animate-spin" />
            <span>Processing Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-text-light">Loading job status...</p>
        </CardContent>
      </Card>
    );
  }

  if (!hasActiveJob || !currentJob) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-text-light" />
            <span>Processing Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-text-light">No active processing jobs</p>
        </CardContent>
      </Card>
    );
  }
}