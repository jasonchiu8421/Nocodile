"use client";
// This component displays training metrics charts

import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

// Define the type for our training results
export type TrainingResults = {
	modelPath: string;
	accuracyGraph: string;
	lossGraph: string;
	accuracyData: {
		epoch: number[];
		accuracy: number[];
		valAccuracy: number[];
	};
	lossData: {
		epoch: number[];
		loss: number[];
		valLoss: number[];
	};
};

// Function to convert results data into chart data format
const convertResultsToChartData = (results: TrainingResults) => {
  return results.accuracyData.epoch.map((epoch, index) => ({
    epoch: epoch,
    accuracy: results.accuracyData.accuracy[index],
    valAccuracy: results.accuracyData.valAccuracy[index],
    loss: results.lossData.loss[index],
    valLoss: results.lossData.valLoss[index],
  }));
};

// Chart configuration for accuracy metrics
const accuracyChartConfig = {
	accuracy: {
		label: "Accuracy",
		color: "hsl(var(--chart-1))",
	},
	valAccuracy: {
		label: "Validation Accuracy",
		color: "hsl(var(--chart-2))",
	},
} satisfies ChartConfig;

// Chart configuration for loss metrics
const lossChartConfig = {
	loss: {
		label: "Loss",
		color: "hsl(var(--chart-3))",
	},
	valLoss: {
		label: "Validation Loss",
		color: "hsl(var(--chart-4))",
	},
} satisfies ChartConfig;

type ModelMetricsChartProps = {
	results: TrainingResults;
};

export function AccuracyChart({ results }: ModelMetricsChartProps) {
	const chartData = convertResultsToChartData(results);
    console.log(chartData)	
	return (
		<Card>
			<CardHeader>
				<CardTitle>Accuracy Metrics</CardTitle>
				<CardDescription>Training and Validation Accuracy</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={accuracyChartConfig}>
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
							dataKey="epoch"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							tickFormatter={(value) => value.toString()}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent />}
						/>
						<Line
							dataKey="accuracy"
							type="natural"
							stroke="var(--color-accuracy)"
							strokeWidth={2}
							dot={{
								fill: "var(--color-accuracy)",
							}}
							activeDot={{
								r: 6,
							}}
						/>
						<Line
							dataKey="valAccuracy"
							type="natural"
							stroke="var(--color-valAccuracy)"
							strokeWidth={2}
							dot={{
								fill: "var(--color-valAccuracy)",
							}}
							activeDot={{
								r: 6,
							}}
						/>
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}

export function LossChart({ results }: ModelMetricsChartProps) {
	const chartData = convertResultsToChartData(results);
	
	return (
		<Card>
			<CardHeader>
				<CardTitle>Loss Metrics</CardTitle>
				<CardDescription>Training and Validation Loss</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={lossChartConfig}>
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
							dataKey="epoch"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							tickFormatter={(value) => value.toString()}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent />}
						/>
						<Line
							dataKey="loss"
							type="natural"
							stroke="var(--color-loss)"
							strokeWidth={2}
							dot={{
								fill: "var(--color-loss)",
							}}
							activeDot={{
								r: 6,
							}}
						/>
						<Line
							dataKey="valLoss"
							type="natural"
							stroke="var(--color-valLoss)"
							strokeWidth={2}
							dot={{
								fill: "var(--color-valLoss)",
							}}
							activeDot={{
								r: 6,
							}}
						/>
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
