import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatEther } from "viem";

// --- YYYY/MM/DD ---
const formatTimestamp = (ts: number) => {
  const date = new Date(ts * 1000);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
};

// --- Curve ---
const VestingChart = ({ schedule }: { schedule: any }) => {
  if (!schedule || schedule.totalAmount === 0n) return null;

  const total = Number(formatEther(schedule.totalAmount));
  const start = Number(schedule.start) || Math.floor(Date.now() / 1000);
  const duration = Number(schedule.duration);
  const cliff = Number(schedule.cliff);
  const interval = Number(schedule.interval) || 1;
  const type = Number(schedule.curve);

  const data = [];
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const timeOffset = (duration * i) / steps;
    const currentTime = start + timeOffset;
    let vested = 0;

    if (currentTime >= start + duration) {
      vested = total;
    } else if (currentTime < start) {
      vested = 0;
    } else {
      if (type === 0) vested = (total * timeOffset) / duration;
      else if (type === 1) vested = currentTime < cliff ? 0 : (total * timeOffset) / duration;
      else if (type === 2) {
        const sc = Math.floor(timeOffset / interval);
        const ts = Math.floor(duration / interval);
        vested = ts > 0 ? (total * sc) / ts : 0;
      } else if (type === 3) vested = (total * timeOffset ** 2) / duration ** 2;
    }
    data.push({
      displayTime: formatTimestamp(currentTime),
      amount: parseFloat(vested.toFixed(2)),
    });
  }

  return (
    <div className="h-64 w-full mt-6 rounded-2xl p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          <XAxis dataKey="displayTime" stroke="#666" fontSize={12} tickMargin={10} />
          <YAxis stroke="#666" fontSize={12} tickFormatter={val => val.toFixed(0)} />
          <Tooltip
            cursor={false}
            contentStyle={{ backgroundColor: "#1a1a1a", border: "none", borderRadius: "12px" }}
            itemStyle={{ color: "#10b981" }}
            labelStyle={{ color: "#9ca3af", marginBottom: "4px" }}
            labelFormatter={label => `Date: ${label}`}
          />
          <Area type="monotone" dataKey="amount" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
export default VestingChart;
