"use client"
// This uses placeholder data
/**
 * results = {
 * results: {
    modelPath: "placeholder.h5",
    accuracyGraph: "placeholder.png",
    lossGraph: "placeholder.png",
    accuracyData: {
      epoch: [1,2,3,4,5,6,7,8,9,10],
      accuracy: [0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0],
      valAccuracy: [0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0],
    },
    lossData: {
      epoch: [1,2,3,4,5,6,7,8,9,10],
      loss: [0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0],
      valLoss: [0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0],
    },
  }}
 */

import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
/*const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]
*/
const results = {
       modelPath: "placeholder.h5",
       accuracyGraph: "placeholder.png",
       lossGraph: "placeholder.png",
       accuracyData: {
         epoch: [1,2,3,4,5,6,7,8,9,10],
         accuracy: [0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0],
         valAccuracy: [0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0],
       },
       lossData: {
         epoch: [1,2,3,4,5,6,7,8,9,10],
         loss: [0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0],
         valLoss: [0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0],
             },
}
const chartData = [
]
const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function Component() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Line Chart - Dots</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Line
              dataKey="desktop"
              type="natural"
              stroke="var(--color-desktop)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-desktop)",
              }}
              activeDot={{
                r: 6,
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
      </CardFooter>
    </Card>
  )
}
