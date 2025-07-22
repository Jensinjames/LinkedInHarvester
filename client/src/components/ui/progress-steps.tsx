import { cn } from "@/lib/utils";
import { Check, Circle } from "lucide-react";
import { motion } from "framer-motion";

interface ProgressStep {
  id: string;
  title: string;
  description?: string;
}

interface ProgressStepsProps {
  steps: ProgressStep[];
  currentStep: string;
  completedSteps: string[];
  className?: string;
}

export default function ProgressSteps({
  steps,
  currentStep,
  completedSteps,
  className
}: ProgressStepsProps) {
  const currentIndex = steps.findIndex(step => step.id === currentStep);
  
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStep;
          const isActive = index <= currentIndex;
          
          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="relative">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    {
                      "bg-green-500 border-green-500 text-white": isCompleted,
                      "bg-blue-500 border-blue-500 text-white": isCurrent && !isCompleted,
                      "bg-gray-200 border-gray-300 text-gray-600": !isActive && !isCompleted,
                      "bg-white border-blue-500 text-blue-500": isActive && !isCurrent && !isCompleted,
                    }
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" fill="currentColor" />
                  )}
                </motion.div>
                
                {/* Pulse animation for current step */}
                {isCurrent && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-blue-500"
                  />
                )}
              </div>
              
              {/* Step Content */}
              <div className="ml-4 flex-1">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  <p className={cn(
                    "text-sm font-medium transition-colors",
                    {
                      "text-green-600": isCompleted,
                      "text-blue-600": isCurrent,
                      "text-gray-900": isActive && !isCurrent && !isCompleted,
                      "text-gray-500": !isActive,
                    }
                  )}>
                    {step.title}
                  </p>
                  {step.description && (
                    <p className={cn(
                      "text-xs transition-colors",
                      {
                        "text-green-500": isCompleted,
                        "text-blue-500": isCurrent,
                        "text-gray-600": isActive && !isCurrent && !isCompleted,
                        "text-gray-400": !isActive,
                      }
                    )}>
                      {step.description}
                    </p>
                  )}
                </motion.div>
              </div>
              
              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: index < currentIndex ? 1 : 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="h-0.5 bg-green-500 origin-left"
                    style={{
                      backgroundColor: index < currentIndex ? '#10b981' : '#e5e7eb'
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}