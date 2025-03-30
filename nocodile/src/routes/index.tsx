import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart2, Brain, ChevronRight, Database, Play } from "lucide-react"
import { NavLink } from "react-router-dom"
import { useProgressStore } from "@/store/useProgressStore"
import { cn } from "@/lib/utils"

export default function Index() {
  const { isStepCompleted, isStepAvailable } = useProgressStore();
  
  const steps = [
    { 
      title: "Data Preprocessing", 
      route: "/preprocessing", 
      icon: Database,
      step: "preprocessing" as const
    },
    { 
      title: "Model Building & Training", 
      route: "/training", 
      icon: Brain,
      step: "training" as const
    },
    { 
      title: "Prediction", 
      route: "/predicting", 
      icon: BarChart2,
      step: "predicting" as const
    },
    { 
      title: "Try the Model", 
      route: "/testing", 
      icon: Play,
      step: "testing" as const
    },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-100">
      <Card className="w-full max-w-320">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Welcome to Nocodile AI
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 justify-between items-center">
          {steps.map((step) => {
            const isCompleted = step.step !== "testing" ? isStepCompleted(step.step) : false;
            const isAvailable = step.step !== "testing" ? isStepAvailable(step.step) : false;
            
            return (
              <NavLink key={step.route} to={step.route} className="flex-1 min-w-72 h-20">
                {() => (
                  <Button
                    key={step.route}
                    variant="outline"
                    className="w-full h-full flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <step.icon className={cn(
                        "w-6 h-6",
                        !isAvailable && !isCompleted && "text-gray-400"
                      )} />
                      <span className={cn(
                        "text-lg",
                        !isAvailable && !isCompleted && "text-gray-400"
                      )}>
                        {step.title}
                        {isCompleted && " ✓"}
                      </span>
                    </div>
                    <ChevronRight className={cn(
                      "w-5 h-5 transition-transform group-hover:translate-x-1",
                      !isAvailable && !isCompleted && "text-gray-400"
                    )} />
                  </Button>
                )}
              </NavLink>
            );
          })}
        </CardContent>
      </Card>
    </div>
  )
}
