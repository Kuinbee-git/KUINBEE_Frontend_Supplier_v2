import { Check } from "lucide-react";
import { useSupplierTokens } from "@/hooks/useSupplierTokens";

type StepStatus = "completed" | "active" | "upcoming";

interface Step {
  id: number;
  label: string;
  status: StepStatus;
}

interface ProgressStepperProps {
  steps: Step[];
}

/**
 * Progress stepper for onboarding flow
 * Shows current step, completed steps, and upcoming steps
 */
export function ProgressStepper({ steps }: ProgressStepperProps) {
  const tokens = useSupplierTokens();

  const stepBg = (status: StepStatus) => {
    if (status === "completed") return tokens.successText;
    if (status === "active")
      return "linear-gradient(135deg, #1a2240 0%, #2a3250 100%)";
    return tokens.isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(26, 34, 64, 0.06)";
  };

  const stepBorder = (status: StepStatus) => {
    return status === "upcoming" ? `2px solid ${tokens.borderDefault}` : "none";
  };

  const stepShadow = (status: StepStatus) => {
    return status === "active" ? "0 4px 12px rgba(26, 34, 64, 0.25)" : "none";
  };

  const textColor = (status: StepStatus) => {
    if (status === "upcoming") return tokens.textMuted;
    return tokens.textPrimary;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center gap-2.5 flex-1">
              <div
                className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0"
                style={{
                  background: stepBg(step.status),
                  border: stepBorder(step.status),
                  boxShadow: stepShadow(step.status),
                }}
              >
                {step.status === "completed" ? (
                  <Check className="w-5 h-5 text-white" strokeWidth={2.5} />
                ) : (
                  <span
                    className="text-sm transition-colors duration-300"
                    style={{
                      color: step.status === "active" ? "#ffffff" : tokens.textMuted,
                      fontWeight: step.status === "active" ? "600" : "500",
                    }}
                  >
                    {step.id}
                  </span>
                )}
              </div>
              <span
                className="text-xs whitespace-nowrap transition-colors duration-300 text-center"
                style={{
                  color: textColor(step.status),
                  fontWeight: step.status === "active" ? "600" : "500",
                  lineHeight: "1.4",
                }}
              >
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className="h-0.5 transition-all duration-300 flex-shrink-0"
                style={{
                  width: "60px",
                  marginLeft: "-30px",
                  marginRight: "-30px",
                  background:
                    steps[index + 1].status === "completed" ||
                    steps[index + 1].status === "active"
                      ? tokens.successText
                      : tokens.borderDefault,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
