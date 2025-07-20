import React, { useEffect, useState } from "react";
import { CloudCog } from "lucide-react";

interface LoadingScreenProps {
    isLoading: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading }) => {
    const steps = [
        "Extracting Necessary Data...",
        "Processing Image with AI Model...",
        "Converting Data into Text...",
        "Finalizing Results...",
    ];
    const [currentStep, setCurrentStep] = useState(0);
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep((prev) => (prev + 1) % steps.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [steps.length]);

    useEffect(() => {
        if (isLoading) {
            const startTime = Date.now();
            const timer = setInterval(() => {
                setElapsed(Date.now() - startTime);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isLoading]);

    if (!isLoading) return null;

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
        const seconds = String(totalSeconds % 60).padStart(2, "0");
        return `${hours}:${minutes}:${seconds}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm">
            <div className="flex flex-col items-center space-y-6 p-8 bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
                <div className="relative w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 w-full h-full border-4 border-t-transparent border-blue-500/20 rounded-full animate-spin" />
                    <div
                        className="absolute inset-0 w-full h-full border-4 border-t-transparent border-l-transparent border-r-blue-500 border-b-blue-500 rounded-full animate-spin"
                        style={{ animationDuration: "1.5s" }}
                    />
                    <CloudCog className="w-10 h-10 text-blue-600" />
                </div>

                <div className="space-y-2 text-center">
                    <p className="text-xl font-semibold text-gray-800">
                        {steps[currentStep]}
                    </p>
                    <div className="text-gray-500 font-medium flex items-center gap-2 justify-center">
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <circle cx="12" cy="12" r="10" strokeWidth="2" stroke="#CBD5E0" />
                            <path
                                strokeLinecap="round"
                                d="M12 6v6l4 2"
                                strokeWidth="2"
                                stroke="currentColor"
                            />
                        </svg>
                        {formatTime(elapsed)}
                    </div>
                </div>

                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 rounded-full animate-pulse"
                        style={{ width: `${(currentStep + 1) * 25}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;