"use client";

import { useUserQuery } from "@/hooks/UseUser";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export default function UserChartPage() {
  const { data, isLoading, error } = useUserQuery();

  if (isLoading)
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (error)
    return <p className="text-sm text-destructive">Error loading user data</p>;
  if (!data || data.length === 0)
    return <p className="text-sm">No users found</p>;

  // ✅ Count users per role
  const roleCounts: Record<string, number> = {};
  data.forEach((user: any) => {
    roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
  });

  const chartData = Object.entries(roleCounts).map(([role, count]) => ({
    role,
    count,
  }));

  // ✅ Chart config
  const chartConfig = {
    count: {
      label: "User Count",
      color: "#4f46e5",
    },
  } satisfies ChartConfig;

  return (
    <main className="p-6 min-h-screen">
      <Card className="w-1/4 rounded-xl border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-primary text-center">
            User Roles Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="h-50">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <BarChart data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="role" tickLine={false} tickMargin={2} />
              <YAxis allowDecimals={false} tickLine={false} tickMargin={2} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </main>
  );
}
