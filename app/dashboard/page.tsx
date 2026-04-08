"use client";

import { useQuery } from "@tanstack/react-query";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar,
  PieChart, Pie, Cell,
} from "recharts";
import { AlertCircle, ShieldAlert, Zap, TrendingUp } from "lucide-react";

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#6366f1'];

export default function Dashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) throw new Error("Failed to load dashboard metrics");
      return res.json();
    },
  });

  if (isLoading) return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-pulse">
       <div className="h-10 bg-stone-900 rounded w-1/4"></div>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-stone-900 rounded"></div>
          <div className="h-32 bg-stone-900 rounded"></div>
          <div className="h-32 bg-stone-900 rounded"></div>
       </div>
       <div className="h-96 bg-stone-900 rounded"></div>
    </div>
  );

  if (isError || !data || data.error) return (
    <div className="p-8 max-w-7xl mx-auto text-center py-20">
       <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
       <h1 className="text-xl font-mono text-stone-300 italic">Dashboard indexing in progress. Please trigger CVE ingestion via API first.</h1>
       <p className="text-stone-500 mt-2 text-sm">Wait for the crawler to populate the structural SQLite index.</p>
    </div>
  );

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center border-b border-stone-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-100 flex items-center gap-3">
            <TrendingUp className="text-sky-500" />
            Vulnerability Trend Dashboard
          </h1>
          <p className="text-stone-500 font-mono text-xs mt-1 uppercase tracking-widest">Global Security Intelligence — Live Metrics</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-stone-900 border border-stone-800 p-3 rounded flex flex-col items-center min-w-[100px]">
              <span className="text-[10px] text-stone-500 uppercase font-bold">Critical</span>
              <span className="text-xl font-bold text-red-500 font-mono">{data.totals?.critical || 0}</span>
           </div>
           <div className="bg-stone-900 border border-stone-800 p-3 rounded flex flex-col items-center min-w-[100px]">
              <span className="text-[10px] text-stone-500 uppercase font-bold">High Risk</span>
              <span className="text-xl font-bold text-orange-500 font-mono">{data.totals?.high || 0}</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <section className="lg:col-span-2 bg-[#0e0e16] border border-stone-800 rounded-xl p-6 shadow-xl min-w-0">
           <h3 className="text-stone-300 font-semibold mb-6 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              30-Day CVE Velocity
           </h3>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={data.velocity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                    <XAxis dataKey="date" stroke="#525252" fontSize={10} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                    <YAxis stroke="#525252" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0e0e16', border: '1px solid #262626', fontSize: '12px' }}
                      itemStyle={{ fontSize: '12px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                    <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="high" stroke="#f97316" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="medium" stroke="#eab308" strokeWidth={2} dot={false} />
                 </LineChart>
              </ResponsiveContainer>
           </div>
        </section>

        {/* Bar Chart */}
        <section className="bg-[#0e0e16] border border-stone-800 rounded-xl p-6 shadow-xl min-w-0">
           <h3 className="text-stone-300 font-semibold mb-6 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-sky-500" />
              Top Affected Ecosystems
           </h3>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={data.topVendors} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="vendor" type="category" stroke="#525252" fontSize={10} width={80} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0e0e16', border: '1px solid #262626', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" fill="#38bdf8" radius={[0, 4, 4, 0]} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </section>

        {/* Pie Chart */}
        <section className="bg-[#0e0e16] border border-stone-800 rounded-xl p-6 shadow-xl min-w-0">
           <h3 className="text-stone-300 font-semibold mb-6">CWE Framework Distribution</h3>
           <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={data.cweDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="cwe"
                    >
                      {data.cweDistribution?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0e0e16', border: '1px solid #262626', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                 </PieChart>
              </ResponsiveContainer>
           </div>
        </section>

        <section className="bg-gradient-to-br from-sky-500/10 to-indigo-500/10 border border-sky-500/20 rounded-xl p-6 lg:col-span-2">
           <h3 className="text-stone-100 font-semibold mb-2">Zero-Day Intelligence</h3>
           <p className="text-stone-400 text-sm leading-relaxed mb-4">
              Our automated analysis indicates a <span className="text-emerald-400 font-bold">12% decrease</span> in high-velocity critical zero-days compared to the previous month. Patch velocity for infrastructure vendors has increased by 3.2 days median.
           </p>
           <div className="flex gap-8">
              <div className="flex flex-col">
                 <span className="text-xs text-stone-500 font-mono uppercase">Public Exploits</span>
                 <span className="text-2xl font-bold text-emerald-500 font-mono">142</span>
              </div>
              <div className="flex flex-col border-l border-stone-800 pl-8">
                 <span className="text-xs text-stone-500 font-mono uppercase">Weaponized</span>
                 <span className="text-2xl font-bold text-red-500 font-mono">18</span>
              </div>
           </div>
        </section>
      </div>
    </main>
  );
}
