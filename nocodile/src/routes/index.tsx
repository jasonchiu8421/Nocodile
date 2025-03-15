import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart2, Brain, ChevronRight, Database, Play } from "lucide-react"
import { NavLink } from "react-router-dom"

export default function Index() {
  const steps = [
    { title: "Data Preprocessing", route: "/preprocessing", icon: Database },
    { title: "Model Building & Training", route: "/training", icon: Brain },
    { title: "Model Performance", route: "/performance", icon: BarChart2 },
    { title: "Try the Model", route: "/try", icon: Play },
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
          {steps.map((step) => (
            <NavLink key={step.route} to={step.route} className="flex-1 min-w-72 h-20">
              {() => (
                <Button
                  key={step.route}
                  variant="outline"
                  className="w-full h-full flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <step.icon className="w-6 h-6" />
                    <span className="text-lg">{step.title}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              )}
            </NavLink>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
