import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { linkedInService } from "./services/linkedin-api";
import { excelProcessor } from "./services/excel-processor";
import { jobQueue } from "./services/job-queue";
import { insertJobSchema } from "@shared/schema";

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.get("/api/auth/status", async (req, res) => {
    // Mock authenticated user for demo
    const user = await storage.getUser(1);
    res.json({
      isAuthenticated: !!user,
      user: user ? {
        username: user.username,
        linkedinConnected: !!user.linkedinAccessToken,
      } : null,
    });
  });

  app.get("/api/auth/status-detailed", async (req, res) => {
    const user = await storage.getUser(1);
    const apiStats = await storage.getApiStats(1);
    
    res.json({
      linkedinConnected: !!user?.linkedinAccessToken,
      proxyActive: true, // Mock proxy status
      rateLimitInfo: {
        used: apiStats?.requestsUsed || 0,
        limit: apiStats?.requestsLimit || 1000,
        resetTime: apiStats?.resetTime ? 
          Math.ceil((apiStats.resetTime.getTime() - Date.now()) / (1000 * 60)) + ' minutes' : 
          'Unknown',
      },
    });
  });

  app.post("/api/auth/linkedin", async (req, res) => {
    try {
      const authUrl = linkedInService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate LinkedIn auth URL" });
    }
  });

  app.post("/api/auth/linkedin/reconnect", async (req, res) => {
    try {
      const authUrl = linkedInService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      res.status(500).json({ error: "Failed to reconnect LinkedIn" });
    }
  });

  app.get("/api/auth/linkedin/callback", async (req, res) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(400).json({ error: "Authorization code required" });
      }

      const tokens = await linkedInService.exchangeCodeForTokens(code as string);
      const userId = 1; // Mock user ID
      
      await storage.updateUserLinkedInTokens(
        userId, 
        tokens.accessToken, 
        tokens.refreshToken, 
        new Date(Date.now() + tokens.expiresIn * 1000)
      );

      res.redirect('/'); // Redirect back to dashboard
    } catch (error) {
      res.status(500).json({ error: "Failed to authenticate with LinkedIn" });
    }
  });

  // File upload routes
  app.post("/api/files/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const profiles = await excelProcessor.parseLinkedInUrls(req.file.path);
      
      res.json({
        id: req.file.filename,
        name: req.file.originalname,
        size: req.file.size,
        profileCount: profiles.length,
        status: 'uploaded',
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to process Excel file" });
    }
  });

  app.get("/api/files/uploaded", async (req, res) => {
    // Mock uploaded files - in real implementation, store in database
    res.json([]);
  });

  app.delete("/api/files/:id", async (req, res) => {
    try {
      // Remove file logic here
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove file" });
    }
  });

  // Job management routes
  app.post("/api/jobs/start", async (req, res) => {
    try {
      const { fileId, batchSize } = req.body;
      const userId = 1; // Mock user ID

      // Parse validation for the job data
      const jobData = insertJobSchema.parse({
        userId,
        fileName: `file_${fileId}.xlsx`,
        totalProfiles: 100, // Mock value - get from actual file parsing
        batchSize,
        filePath: `uploads/${fileId}`,
      });

      const job = await storage.createJob(jobData);
      
      // Start background job processing
      await jobQueue.addJob({
        jobId: job.id,
        userId,
        filePath: job.filePath,
        batchSize: job.batchSize || 50,
      });

      res.json({ jobId: job.id, status: 'started' });
    } catch (error) {
      res.status(500).json({ error: "Failed to start job processing" });
    }
  });

  app.get("/api/jobs/current-status", async (req, res) => {
    try {
      const userId = 1; // Mock user ID
      const activeJob = await storage.getActiveJob(userId);
      
      if (!activeJob) {
        return res.json(null);
      }

      const totalProcessed = activeJob.processedProfiles || 0;
      const percentage = Math.round((totalProcessed / activeJob.totalProfiles) * 100);
      const remaining = activeJob.totalProfiles - totalProcessed;
      
      res.json({
        fileName: activeJob.fileName,
        status: activeJob.status,
        progress: {
          percentage,
          processed: totalProcessed,
          total: activeJob.totalProfiles,
          successful: activeJob.successfulProfiles || 0,
          retrying: activeJob.retryingProfiles || 0,
          failed: activeJob.failedProfiles || 0,
          remaining,
          eta: activeJob.estimatedCompletion ? 
            Math.ceil((activeJob.estimatedCompletion.getTime() - Date.now()) / (1000 * 60)) + 'm' : 
            'Calculating...',
          rate: activeJob.processingRate || 'Calculating...',
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get job status" });
    }
  });

  app.get("/api/jobs/recent", async (req, res) => {
    try {
      const userId = 1; // Mock user ID
      const jobs = await storage.getJobsByUser(userId);
      
      const recentJobs = jobs.slice(0, 10).map(job => ({
        id: job.id,
        fileName: job.fileName,
        totalProfiles: job.totalProfiles,
        status: job.status,
        progress: job.processedProfiles ? 
          Math.round((job.processedProfiles / job.totalProfiles) * 100) : 0,
        successRate: job.totalProfiles > 0 ? 
          ((job.successfulProfiles || 0) / job.totalProfiles * 100).toFixed(1) + '%' : 
          '0%',
        startedAt: job.startedAt?.toISOString() || job.createdAt.toISOString(),
      }));

      res.json(recentJobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to get recent jobs" });
    }
  });

  app.post("/api/jobs/:id/pause", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      await storage.updateJobStatus(jobId, 'paused');
      await jobQueue.pauseJob(jobId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to pause job" });
    }
  });

  app.post("/api/jobs/:id/stop", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      await storage.updateJobStatus(jobId, 'failed');
      await jobQueue.stopJob(jobId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to stop job" });
    }
  });

  app.get("/api/jobs/:id/download", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      
      if (!job || !job.resultPath) {
        return res.status(404).json({ error: "Results not found" });
      }

      res.download(job.resultPath);
    } catch (error) {
      res.status(500).json({ error: "Failed to download results" });
    }
  });

  app.delete("/api/jobs/:id", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      // In real implementation, remove job from database
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete job" });
    }
  });

  // Statistics routes
  app.get("/api/stats/overview", async (req, res) => {
    try {
      const userId = 1; // Mock user ID
      const stats = await storage.getJobStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get overview stats" });
    }
  });

  app.get("/api/stats/errors", async (req, res) => {
    try {
      const userId = 1; // Mock user ID
      const errorBreakdown = await storage.getErrorBreakdown(userId);
      res.json(errorBreakdown);
    } catch (error) {
      res.status(500).json({ error: "Failed to get error breakdown" });
    }
  });

  app.get("/api/stats/export-counts", async (req, res) => {
    try {
      const userId = 1; // Mock user ID
      const stats = await storage.getJobStats(userId);
      res.json({
        successful: stats.successfulProfiles,
        failed: stats.failedProfiles,
        total: stats.totalProfiles,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get export counts" });
    }
  });

  // Export routes
  app.post("/api/export/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const userId = 1; // Mock user ID
      
      const excelBuffer = await excelProcessor.exportResults(userId, type as 'successful' | 'failed' | 'all');
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=linkedin_data_${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
      res.send(excelBuffer);
    } catch (error) {
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
