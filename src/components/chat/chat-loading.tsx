"use client";

import { Progress } from "@/components/ui/progress";
import { useChatContext } from "@/contexts/ChatContext";
import { CheckCircle, Loader2, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export function ChatLoading() {
  const { state } = useChatContext();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: "Authenticating user", completed: !!state.currentUser },
    { label: "Connecting to chat server", completed: state.isConnected },
    { label: "Loading chat data", completed: state.isInitialized },
    { label: "Ready to chat", completed: state.isInitialized },
  ];

  useEffect(() => {
    const completedSteps = steps.filter((step) => step.completed).length;
    const newProgress = (completedSteps / steps.length) * 100;

    setProgress(newProgress);
    setCurrentStep(completedSteps);
  }, [state.currentUser, state.isConnected, state.isInitialized]);

  const getStepIcon = (stepIndex: number, stepCompleted: boolean) => {
    if (stepCompleted) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (stepIndex === currentStep) {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    } else {
      return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <div className="text-2xl">💬</div>
          </div>
          <h1 className="text-2xl font-bold">Setting up your chat</h1>
          <p className="text-muted-foreground">
            Please wait while we initialize your chat experience
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center space-x-3">
              {getStepIcon(index, step.completed)}
              <span
                className={`text-sm ${
                  step.completed
                    ? "text-foreground font-medium"
                    : index === currentStep
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Connection Status */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Connection Status</span>
            <div className="flex items-center space-x-2">
              {state.isConnected ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-green-600">Connected</span>
                </>
              ) : state.isConnecting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                  <span className="text-blue-600">Connecting...</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-red-500" />
                  <span className="text-red-600">Disconnected</span>
                </>
              )}
            </div>
          </div>

          {state.connectionError && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
              {state.connectionError}
            </div>
          )}
        </div>

        {/* Loading Animation */}
        <div className="flex justify-center pt-4">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
