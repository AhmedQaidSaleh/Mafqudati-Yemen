import { Check, ShieldCheck, MapPin, CheckCircle2, MessageSquare } from "lucide-react";

export type HandoverStep = 1 | 2 | 3 | 4;

interface ChatStepperProps {
  currentStep: HandoverStep;
  onSelectStep?: (step: HandoverStep) => void;
  isResolved?: boolean;
}

const STEPS = [
  { id: 1, title: "التعارف والتواصل", shortTitle: "التعارف", icon: MessageSquare },
  { id: 2, title: "التحقق السري", shortTitle: "التحقق السري", icon: ShieldCheck },
  { id: 3, title: "مكان اللقاء الآمن", shortTitle: "مكان اللقاء", icon: MapPin },
  { id: 4, title: "تأكيد الاستلام", shortTitle: "تأكيد الاستلام", icon: CheckCircle2 },
] as const;

export function ChatStepper({ currentStep, onSelectStep, isResolved }: ChatStepperProps) {
  const activeStep = isResolved ? 4 : currentStep;

  return (
    <div className="border-b border-border bg-card/60 px-3 py-2 sm:px-5">
      <div className="flex items-center justify-between gap-1 sm:gap-2 max-w-xl mx-auto">
        {STEPS.map((step, idx) => {
          const isCompleted = activeStep > step.id || (isResolved && step.id === 4);
          const isCurrent = activeStep === step.id && !isResolved;
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="flex items-center flex-1 min-w-0">
              <button
                type="button"
                onClick={() => onSelectStep?.(step.id as HandoverStep)}
                className={`flex items-center gap-1.5 rounded-xl px-2 py-1 transition text-start w-full min-w-0 ${
                  isCurrent
                    ? "bg-primary/10 text-primary font-bold"
                    : isCompleted
                      ? "text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                title={step.title}
              >
                <div
                  className={`size-6 rounded-lg flex items-center justify-center text-xs shrink-0 transition-colors ${
                    isCompleted
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Check className="size-3.5 stroke-[3]" /> : <StepIcon className="size-3.5" />}
                </div>

                <div className="min-w-0 hidden xs:block sm:block">
                  <span className="text-[11px] sm:text-xs block truncate leading-tight">
                    {step.shortTitle}
                  </span>
                </div>
              </button>

              {idx < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-2 sm:w-4 shrink-0 mx-0.5 sm:mx-1 rounded-full ${
                    activeStep > step.id ? "bg-emerald-500" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
