import {
  FileText, Code, MessageSquare, Hash, FunctionSquare, Box,
  Variable, Repeat, GitBranch, Layers, Clock, HardDrive,
  AlertTriangle, AlertCircle, Info, Lightbulb, Download, Timer,
} from "lucide-react";
import { AnalysisReport } from "@/lib/analyzer";
import MetricsCard from "./MetricsCard";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";

interface AnalysisReportViewProps {
  report: AnalysisReport;
  onExportPdf: () => void;
}

const CHART_COLORS = [
  "hsl(174, 72%, 50%)",
  "hsl(142, 60%, 50%)",
  "hsl(38, 92%, 55%)",
  "hsl(210, 80%, 60%)",
  "hsl(280, 60%, 60%)",
];

const issueIcons = { error: AlertCircle, warning: AlertTriangle, info: Info };
const issueColors = {
  error: "text-destructive border-destructive/30 bg-destructive/5",
  warning: "text-warning border-warning/30 bg-warning/5",
  info: "text-info border-info/30 bg-info/5",
};
const priorityColors = { high: "bg-destructive/20 text-destructive", medium: "bg-warning/20 text-warning", low: "bg-info/20 text-info" };

const AnalysisReportView = ({ report, onExportPdf }: AnalysisReportViewProps) => {
  const { metrics, complexity, issues, suggestions } = report;

  const compositionData = [
    { name: "Code", value: metrics.codeLines },
    { name: "Comments", value: metrics.commentLines },
    { name: "Blank", value: metrics.blankLines },
  ];

  const structureData = [
    { name: "Functions", value: metrics.functions },
    { name: "Classes", value: metrics.classes },
    { name: "Variables", value: metrics.variables },
    { name: "Loops", value: metrics.loops },
    { name: "Conditionals", value: metrics.conditionals },
  ];

  return (
    <div id="analysis-report" className="space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gradient">Analysis Report</h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs font-mono text-muted-foreground">
              Language: {report.language.toUpperCase()}
            </span>
            <span className="flex items-center gap-1 text-xs font-mono text-primary">
              <Timer className="w-3 h-3" />
              {report.analysisTimeMs}ms
            </span>
          </div>
        </div>
        <button
          onClick={onExportPdf}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      {/* Metrics Grid */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Code Metrics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetricsCard icon={FileText} label="Total Lines" value={metrics.totalLines} variant="primary" />
          <MetricsCard icon={Code} label="Code Lines" value={metrics.codeLines} />
          <MetricsCard icon={MessageSquare} label="Comments" value={metrics.commentLines} subtext={`${((metrics.commentLines / Math.max(metrics.codeLines, 1)) * 100).toFixed(1)}% density`} />
          <MetricsCard icon={Hash} label="Blank Lines" value={metrics.blankLines} />
          <MetricsCard icon={FunctionSquare} label="Functions" value={metrics.functions} variant="accent" />
          <MetricsCard icon={Box} label="Classes" value={metrics.classes} />
          <MetricsCard icon={Variable} label="Variables" value={metrics.variables} />
          <MetricsCard icon={Repeat} label="Loops" value={metrics.loops} variant={metrics.loops > 5 ? "warning" : "default"} />
          <MetricsCard icon={GitBranch} label="Conditionals" value={metrics.conditionals} />
          <MetricsCard icon={Layers} label="Max Depth" value={metrics.maxNestingDepth} variant={metrics.maxNestingDepth > 4 ? "warning" : "default"} />
        </div>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border border-border p-5">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Line Composition</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={compositionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} strokeWidth={2} stroke="hsl(220, 20%, 7%)">
                {compositionData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 16%, 18%)", borderRadius: "8px", color: "hsl(210, 20%, 90%)", fontFamily: "JetBrains Mono", fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {compositionData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: CHART_COLORS[i] }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-5">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Code Structure</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={structureData}>
              <XAxis dataKey="name" tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 16%, 18%)", borderRadius: "8px", color: "hsl(210, 20%, 90%)", fontFamily: "JetBrains Mono", fontSize: "12px" }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {structureData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Complexity */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Complexity Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card rounded-lg border border-primary/20 p-5 glow-primary">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-muted-foreground">Time Complexity</span>
            </div>
            <div className="text-4xl font-bold font-mono text-primary mb-2">{complexity.time}</div>
            <p className="text-sm text-muted-foreground">{complexity.timeExplanation}</p>
            <div className="mt-3 flex gap-3 text-xs text-muted-foreground font-mono">
              <span>Loops: {complexity.loopCount}</span>
              <span>Depth: {complexity.maxNestingDepth}</span>
              <span>Recursion: {complexity.hasRecursion ? "Yes" : "No"}</span>
            </div>
          </div>
          <div className="bg-card rounded-lg border border-accent/20 p-5 glow-accent">
            <div className="flex items-center gap-2 mb-3">
              <HardDrive className="w-5 h-5 text-accent" />
              <span className="text-sm font-semibold text-muted-foreground">Space Complexity</span>
            </div>
            <div className="text-4xl font-bold font-mono text-accent mb-2">{complexity.space}</div>
            <p className="text-sm text-muted-foreground">{complexity.spaceExplanation}</p>
            <div className="mt-3 flex gap-3 text-xs text-muted-foreground font-mono">
              <span>Variables: {complexity.variableCount}</span>
              <span>Arrays: {complexity.arrayCount}</span>
              <span>Recursion: {complexity.hasRecursion ? "Yes" : "No"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Issues */}
      {issues.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
            Issues & Warnings ({issues.length})
          </h3>
          <div className="space-y-2">
            {issues.map((issue, i) => {
              const IssueIcon = issueIcons[issue.type];
              return (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${issueColors[issue.type]}`}>
                  <IssueIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm text-foreground">{issue.message}</span>
                    {issue.line && <span className="text-xs text-muted-foreground ml-2 font-mono">Line {issue.line}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
            Suggestions ({suggestions.length})
          </h3>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
                <Lightbulb className="w-4 h-4 mt-0.5 text-warning flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.category}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase ${priorityColors[s.priority]}`}>
                      {s.priority}
                    </span>
                  </div>
                  <span className="text-sm text-foreground">{s.message}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* No issues */}
      {issues.length === 0 && (
        <div className="text-center py-8 text-accent font-mono">
          ✓ No issues detected — your code looks clean!
        </div>
      )}
    </div>
  );
};

export default AnalysisReportView;
