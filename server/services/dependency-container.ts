// Dependency injection container for better service decoupling
import { storage } from '../storage';
import { ExcelParser } from './excel/parser';
import { ExcelExporter } from './excel/exporter';
import { LinkedInService } from './linkedin-api';
import { AIProfileExtractor } from './ai-profile-extractor';
import { JobSimulator } from './job-simulator';
import { JobQueue } from './job-queue';

interface Services {
  storage: typeof storage;
  excelParser: ExcelParser;
  excelExporter: ExcelExporter;
  linkedinService: LinkedInService;
  aiProfileExtractor: AIProfileExtractor;
  jobSimulator: JobSimulator;
  jobQueue: JobQueue;
}

class DependencyContainer {
  private services: Partial<Services> = {};

  register<K extends keyof Services>(name: K, service: Services[K]): void {
    this.services[name] = service;
  }

  get<K extends keyof Services>(name: K): Services[K] {
    const service = this.services[name];
    if (!service) {
      throw new Error(`Service ${String(name)} not registered`);
    }
    return service;
  }

  registerAll(): void {
    // Register all services
    this.register('storage', storage);
    this.register('excelParser', new ExcelParser());
    this.register('excelExporter', new ExcelExporter());
    
    // These will be updated to use dependency injection
    this.register('linkedinService', this.createLinkedInService());
    this.register('aiProfileExtractor', this.createAIProfileExtractor());
    this.register('jobSimulator', this.createJobSimulator());
    this.register('jobQueue', this.createJobQueue());
  }

  private createLinkedInService(): LinkedInService {
    // Create with dependencies injected
    const service = new (require('./linkedin-api').LinkedInService)();
    return service;
  }

  private createAIProfileExtractor(): AIProfileExtractor {
    const service = new (require('./ai-profile-extractor').AIProfileExtractor)();
    return service;
  }

  private createJobSimulator(): JobSimulator {
    const service = new (require('./job-simulator').JobSimulator)();
    return service;
  }

  private createJobQueue(): JobQueue {
    const service = new (require('./job-queue').JobQueue)(
      this.get('storage'),
      this.get('excelParser'),
      this.get('aiProfileExtractor')
    );
    return service;
  }
}

export const container = new DependencyContainer();

// Initialize all services
container.registerAll();