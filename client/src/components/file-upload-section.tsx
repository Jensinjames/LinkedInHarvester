import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { CloudUpload, FileSpreadsheet, X, Play, Pause } from "lucide-react";
import { uploadFile } from "@/lib/file-utils";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  profileCount: number;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
}

export default function FileUploadSection() {
  const [dragActive, setDragActive] = useState(false);
  const [batchSize, setBatchSize] = useState("50");

  const { data: uploadedFiles = [], isLoading } = useQuery<UploadedFile[]>({
    queryKey: ["/api/files/uploaded"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      return await uploadFile(file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files/uploaded"] });
      toast({
        title: "File uploaded successfully",
        description: "Your Excel file has been processed and is ready for LinkedIn data extraction.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: "Failed to upload and process the Excel file. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startProcessingMutation = useMutation({
    mutationFn: async (data: { fileId: string; batchSize: number }) => {
      const response = await apiRequest("POST", "/api/jobs/start", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Processing started",
        description: "LinkedIn profile extraction has been initiated.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to start processing",
        description: "Could not initiate the LinkedIn data extraction process.",
        variant: "destructive",
      });
    },
  });

  const removeFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await apiRequest("DELETE", `/api/files/${fileId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files/uploaded"] });
    },
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const excelFile = files.find(file => 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel'
    );
    
    if (excelFile) {
      uploadMutation.mutate(excelFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload Excel files (.xlsx) only.",
        variant: "destructive",
      });
    }
  }, [uploadMutation]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  }, [uploadMutation]);

  const openFileDialog = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = handleFileSelect;
    input.click();
  };

  const handleStartProcessing = () => {
    const firstUploadedFile = uploadedFiles.find(f => f.status === 'uploaded');
    if (firstUploadedFile) {
      startProcessingMutation.mutate({
        fileId: firstUploadedFile.id,
        batchSize: parseInt(batchSize),
      });
    }
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-text-dark">
          File Upload & Processing
        </h2>
        <p className="text-sm text-neutral-gray mt-1">
          Upload Excel files containing LinkedIn profile URLs for batch processing
        </p>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* File Upload Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragActive ? 'border-azure-blue bg-azure-blue bg-opacity-5' : 'border-gray-300 hover:border-azure-blue'
          }`}
          onDragEnter={() => setDragActive(true)}
          onDragLeave={() => setDragActive(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <div className="mx-auto w-16 h-16 bg-azure-blue bg-opacity-10 rounded-full flex items-center justify-center mb-4">
            <CloudUpload className="text-azure-blue text-2xl" />
          </div>
          <h3 className="text-lg font-medium text-text-dark mb-2">
            Drop Excel files here
          </h3>
          <p className="text-neutral-gray mb-4">
            or click to browse and upload .xlsx files
          </p>
          <Button 
            className="bg-azure-blue text-white hover:bg-azure-dark"
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Choose Files'}
          </Button>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="mt-6 space-y-3">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileSpreadsheet className="text-success-green text-xl" />
                  <div>
                    <p className="font-medium text-text-dark">{file.name}</p>
                    <p className="text-sm text-neutral-gray">
                      {file.profileCount.toLocaleString()} URLs • {(file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    file.status === 'uploaded' ? 'bg-azure-blue bg-opacity-10 text-azure-blue' :
                    file.status === 'processing' ? 'bg-warning-orange bg-opacity-10 text-warning-orange' :
                    file.status === 'completed' ? 'bg-success-green bg-opacity-10 text-success-green' :
                    'bg-error-red bg-opacity-10 text-error-red'
                  }`}>
                    {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFileMutation.mutate(file.id)}
                    className="text-neutral-gray hover:text-error-red"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Processing Controls */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-text-dark">Batch Size:</label>
            <Select value={batchSize} onValueChange={setBatchSize}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50 profiles</SelectItem>
                <SelectItem value="100">100 profiles</SelectItem>
                <SelectItem value="250">250 profiles</SelectItem>
                <SelectItem value="500">500 profiles</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="border-gray-300 text-neutral-gray hover:bg-gray-50"
            >
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
            <Button
              onClick={handleStartProcessing}
              disabled={startProcessingMutation.isPending || uploadedFiles.length === 0}
              className="bg-azure-blue text-white hover:bg-azure-dark"
            >
              <Play className="mr-2 h-4 w-4" />
              Start Processing
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
