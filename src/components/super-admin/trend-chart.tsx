"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendData } from "@/lib/queries/super-admin";

type TrendChartProps = {
  data: TrendData[];
  title: string;
  timeRange: "7d" | "30d" | "90d";
};

export function TrendChart({ data, title, timeRange }: TrendChartProps) {
  // Formater les dates pour l'affichage
  const formattedData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString("fr-FR", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <Card className="border-gray-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: "#6b7280" }}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: "#6b7280" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="organizations"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", r: 3 }}
              name="Organisations"
            />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ fill: "#8b5cf6", r: 3 }}
              name="Utilisateurs"
            />
            <Line
              type="monotone"
              dataKey="courses"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: "#10b981", r: 3 }}
              name="Formations"
            />
            <Line
              type="monotone"
              dataKey="paths"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: "#f59e0b", r: 3 }}
              name="Parcours"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}








