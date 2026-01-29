"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@ratecreator/ui";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface PostsByPlatform {
  platform: string;
  count: number;
}

interface PostsByPlatformChartProps {
  data: PostsByPlatform[];
}

const COLORS = {
  RATECREATOR: "hsl(var(--primary))",
  CREATOROPS: "#8b5cf6",
  DOCUMENTATION: "#f59e0b",
  UNITY: "#22c55e",
};

export function PostsByPlatformChart({
  data,
}: PostsByPlatformChartProps): JSX.Element {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Posts by Platform</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No post data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const formattedData = data.map((item) => ({
    ...item,
    name: item.platform.charAt(0) + item.platform.slice(1).toLowerCase(),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Posts by Platform</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={formattedData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {formattedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      COLORS[entry.platform as keyof typeof COLORS] ||
                      "hsl(var(--primary))"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
