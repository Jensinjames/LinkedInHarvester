import { storage } from '../storage';
import { linkedInService } from './linkedin-api';
import { excelProcessor } from './excel-processor';
import { aiProfileExtractor } from './ai-profile-extractor';

interface JobData {
  jobId: number;
  userId: number;
  filePath: string;
  batchSize: number;
}

interface ProcessingJob {
  id: number;
  data: JobData;
  status: 'pending' | 'processing' | 'paused' | 'completed' | 'failed';
  retryCount: number;
}

class JobQueue {
  private jobs: Map<number, ProcessingJob> = new Map();
  private processing: boolean = false;
  private currentJobId: number = 1;

  async addJob(data: JobData): Promise<number> {
    const jobId = this.currentJobId++;
    const job: ProcessingJob = {
      id: jobId,
      data,
      status: 'pending',
      retryCount: 0,
    };

    this.jobs.set(jobId, job);
    
    if (!this.processing) {
      this.startProcessing();
    }

    return jobId;
  }

  async pauseJob(jobId: number): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job && job.status === 'processing') {
      job.status = 'paused';
    }
  }

  async stopJob(jobId: number): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = 'failed';
    }
  }

  async resumeJob(jobId: number): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job && job.status === 'paused') {
      job.status = 'pending';
      if (!this.processing) {
        this.startProcessing();
      }
    }
  }

  private async startProcessing(): Promise<void> {
    if (this.processing) return;
    
    this.processing = true;

    while (this.processing) {
      const nextJob = this.getNextJob();
      if (!nextJob) {
        this.processing = false;
        break;
      }

      await this.processJob(nextJob);
    }
  }

  private getNextJob(): ProcessingJob | null {
    for (const job of this.jobs.values()) {
      if (job.status === 'pending') {
        return job;
      }
    }
    return null;
  }

  private async processJob(job: ProcessingJob): Promise<void> {
    try {
      job.status = 'processing';
      
      // Update job status in storage
      await storage.updateJobStatus(job.data.jobId, 'processing', {
        startedAt: new Date(),
      });

      // Parse LinkedIn URLs from the uploaded file
      const linkedinUrls = await excelProcessor.parseLinkedInUrls(job.data.filePath);
      
      if (linkedinUrls.length === 0) {
        throw new Error('No LinkedIn URLs found in the uploaded file');
      }

      // Create profile records
      for (const urlData of linkedinUrls) {
        await storage.createProfile({
          jobId: job.data.jobId,
          linkedinUrl: urlData.url,
          status: 'pending',
        });
      }

      // Get user's LinkedIn access token
      const user = await storage.getUser(job.data.userId);
      if (!user?.linkedinAccessToken) {
        throw new Error('LinkedIn authentication required');
      }

      // Process profiles in batches
      const batchSize = job.data.batchSize;
      let processed = 0;
      let successful = 0;
      let failed = 0;
      const startTime = Date.now();

      for (let i = 0; i < linkedinUrls.length; i += batchSize) {
        // Check if job was paused or stopped
        const currentJob = this.jobs.get(job.id);
        if (currentJob?.status !== 'processing') {
          return;
        }

        const batch = linkedinUrls.slice(i, i + batchSize);
        
        for (const urlData of batch) {
          try {
            const profile = await this.extractProfileWithRetry(
              user.linkedinAccessToken,
              urlData.url,
              3 // max retries
            );

            // Update profile record
            const profiles = await storage.getProfilesByJob(job.data.jobId);
            const profileRecord = profiles.find(p => p.linkedinUrl === urlData.url);
            
            if (profileRecord) {
              await storage.updateProfileStatus(profileRecord.id, 'success', {
                profileData: profile,
                extractedAt: new Date(),
              });
            }

            successful++;
          } catch (error) {
            const profiles = await storage.getProfilesByJob(job.data.jobId);
            const profileRecord = profiles.find(p => p.linkedinUrl === urlData.url);
            
            if (profileRecord) {
              const errorType = this.categorizeError(error);
              await storage.updateProfileStatus(profileRecord.id, 'failed', {
                errorType,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                lastAttempt: new Date(),
              });
            }

            failed++;
          }

          processed++;
          
          // Update job progress
          const elapsed = Date.now() - startTime;
          const rate = (processed / (elapsed / 1000 / 60)).toFixed(1); // profiles per minute
          const remaining = linkedinUrls.length - processed;
          const eta = remaining > 0 ? new Date(Date.now() + (remaining / parseFloat(rate)) * 60 * 1000) : null;

          await storage.updateJobStatus(job.data.jobId, 'processing', {
            processedProfiles: processed,
            successfulProfiles: successful,
            failedProfiles: failed,
            processingRate: `${rate} profiles/min`,
            estimatedCompletion: eta,
          });

          // Rate limiting - wait between requests
          await this.delay(2000); // 2 seconds between requests
        }

        // Longer delay between batches
        await this.delay(5000); // 5 seconds between batches
      }

      // Job completed
      job.status = 'completed';
      
      // Generate results file
      const profiles = await storage.getProfilesByJob(job.data.jobId);
      const processedProfiles = profiles.map(p => ({
        url: p.linkedinUrl,
        status: p.status as 'success' | 'failed',
        data: p.profileData ? (typeof p.profileData === 'string' ? JSON.parse(p.profileData) : p.profileData) : undefined,
        error: p.errorMessage,
        errorType: p.errorType,
      }));

      const resultPath = await excelProcessor.saveJobResults(job.data.jobId, processedProfiles);

      await storage.updateJobStatus(job.data.jobId, 'completed', {
        completedAt: new Date(),
        resultPath,
      });

    } catch (error) {
      job.status = 'failed';
      await storage.updateJobStatus(job.data.jobId, 'failed', {
        completedAt: new Date(),
      });
    }
  }

  private async extractProfileWithRetry(
    accessToken: string, 
    profileUrl: string, 
    maxRetries: number
  ): Promise<any> {
    let retryCount = 0;
    let delay = 1000; // Start with 1 second

    while (retryCount < maxRetries) {
      try {
        // Use AI profile extractor to get profile data
        const extractedProfile = await aiProfileExtractor.extractProfileFromURL(profileUrl);
        
        // Convert to LinkedIn profile format for compatibility
        return {
          id: profileUrl.split('/').pop() || 'unknown',
          firstName: extractedProfile.firstName,
          lastName: extractedProfile.lastName,
          headline: extractedProfile.headline,
          summary: extractedProfile.summary,
          industry: extractedProfile.industry,
          location: extractedProfile.location,
          publicProfileUrl: profileUrl,
          positions: extractedProfile.experience.map(exp => ({
            title: exp.title,
            company: exp.company,
            startDate: exp.duration.split('-')[0] || '',
            endDate: exp.duration.split('-')[1] || undefined,
            description: exp.description
          })),
          education: extractedProfile.education.map(edu => ({
            school: edu.school,
            degree: edu.degree,
            fieldOfStudy: edu.field,
            startDate: edu.year,
            endDate: edu.year
          })),
          skills: extractedProfile.skills,
          currentPosition: extractedProfile.currentPosition,
          currentCompany: extractedProfile.currentCompany
        };
      } catch (error) {
        const errorType = this.categorizeError(error);
        
        // Don't retry for certain error types
        if (errorType === 'access_restricted' || errorType === 'not_found') {
          throw error;
        }

        retryCount++;
        if (retryCount >= maxRetries) {
          throw error;
        }

        // Exponential backoff for retries
        await this.delay(delay);
        delay *= 2;
      }
    }

    throw new Error('Max retries exceeded');
  }

  private categorizeError(error: unknown): string {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('captcha') || message.includes('challenge')) {
        return 'captcha';
      } else if (message.includes('not_found') || message.includes('404')) {
        return 'not_found';
      } else if (message.includes('access_restricted') || message.includes('403')) {
        return 'access_restricted';
      } else if (message.includes('rate_limit') || message.includes('429')) {
        return 'rate_limit';
      }
    }
    
    return 'unknown';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const jobQueue = new JobQueue();
