import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import apiService from '@/services/api';

const BulkUploadModal = ({ onUploadComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleDownloadTemplate = async () => {
    try {
      const blob = await apiService.downloadBulkUploadTemplate();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'coding_profiles_bulk_template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Template Downloaded",
        description: "Excel template has been downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading template:', error);
      toast({
        title: "Error",
        description: "Failed to download template",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await apiService.bulkUploadProfiles(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        setUploadResult(response.data);
        toast({
          title: "Upload Successful",
          description: `Processed ${response.data.total} rows successfully`,
        });
        
        if (onUploadComplete) {
          onUploadComplete(response.data);
        }
        
        // Fetch updated stats
        fetchStats();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const response = await apiService.getBulkUploadStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSyncProfiles = async () => {
    try {
      setUploading(true);
      const response = await apiService.syncBulkProfiles();
      
      if (response.success) {
        toast({
          title: "Sync Completed",
          description: response.message,
        });
        
        if (onUploadComplete) {
          onUploadComplete(response.data);
        }
        
        fetchStats();
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync profiles",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const openModal = () => {
    setIsOpen(true);
    fetchStats();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={openModal}>
          <Upload className="h-4 w-4 mr-2" />
          Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileSpreadsheet className="h-5 w-5 mr-2" />
            Bulk Upload Coding Profiles
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground">
                <p>1. Download the Excel template using the button below</p>
                <p>2. Fill in Roll Number OR Email ID (at least one required)</p>
                <p>3. Add platform usernames for each student</p>
                <p>4. Upload the completed file</p>
                <p>5. URLs will be auto-generated and profiles will be created</p>
              </div>
            </CardContent>
          </Card>

          {/* Template Download */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Download className="h-5 w-5 mr-2" />
                Download Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={handleDownloadTemplate} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Excel Template
              </Button>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Upload File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button asChild variant="outline" disabled={uploading}>
                  <span>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Choose Excel File
                  </span>
                </Button>
              </label>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Uploading and processing...</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              {uploadResult && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">Upload Completed</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Total Rows:</span> {uploadResult.total}
                        </div>
                        <div>
                          <span className="font-medium">Successful:</span> {uploadResult.successful}
                        </div>
                        <div>
                          <span className="font-medium">Failed:</span> {uploadResult.failed}
                        </div>
                        <div>
                          <span className="font-medium">Profiles Created:</span> {uploadResult.profiles_created}
                        </div>
                      </div>

                      {uploadResult.errors && uploadResult.errors.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {uploadResult.errors.slice(0, 10).map((error, index) => (
                              <div key={index} className="text-xs text-red-600 bg-red-100 p-2 rounded">
                                Row {error.row}: {error.error}
                              </div>
                            ))}
                            {uploadResult.errors.length > 10 && (
                              <div className="text-xs text-red-600">
                                ... and {uploadResult.errors.length - 10} more errors
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Current Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading statistics...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {stats.overall_stats.total_students_with_profiles}
                      </div>
                      <div className="text-sm text-muted-foreground">Students</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {stats.overall_stats.synced_profiles}
                      </div>
                      <div className="text-sm text-muted-foreground">Synced</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {stats.overall_stats.pending_profiles}
                      </div>
                      <div className="text-sm text-muted-foreground">Pending</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {stats.overall_stats.failed_profiles}
                      </div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Sync Button */}
          <div className="flex justify-end space-x-2">
            <Button 
              onClick={handleSyncProfiles} 
              disabled={uploading || !stats?.overall_stats.pending_profiles}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync All Profiles
            </Button>
            <Button onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadModal;