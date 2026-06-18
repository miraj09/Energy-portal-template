import React, { memo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Jan", commission: 500 },
  { name: "Feb", commission: 1500 },
  { name: "Mar", commission: 3500 },
  { name: "Apr", commission: 2500 },
  { name: "May", commission: 4500 },
  { name: "Jun", commission: 4000 },
  { name: "Jul", commission: 3000 },
  { name: "Aug", commission: 2000 },
  { name: "Sep", commission: 1000 },
  { name: "Oct", commission: 500 },
  { name: "Nov", commission: 1500 },
  { name: "Dec", commission: 3500 },
];

const RevenueLineChart = memo(() => {
  return (
    <ResponsiveContainer width="100%" height={205}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#e5e7ef" strokeDasharray="0" vertical={false} />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#4b465c', fontSize: 13, fontFamily: 'Public Sans', fontWeight: 400 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          ticks={[0, 2000, 4000, 6000, 8000, 10000]}
          tickFormatter={v => `${v/1000}k`}
          tick={{ fill: '#4b465c', fontSize: 13, fontFamily: 'Public Sans', fontWeight: 400 }}
        />
        <Tooltip
          contentStyle={{ borderRadius: 8, fontSize: 13, fontFamily: 'Public Sans' }}
          formatter={v => `$${v}`}
        />
        <Line
          type="monotone"
          dataKey="commission"
          stroke="#346fb6"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 5, stroke: '#346fb6', strokeWidth: 2, fill: '#fff' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

RevenueLineChart.displayName = 'RevenueLineChart';

export default RevenueLineChart; 