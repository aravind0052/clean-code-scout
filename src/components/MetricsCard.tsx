import { LucideIcon } from "lucide-react";

interface MetricsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtext?: string;
  variant?: "default" | "primary" | "accent" | "warning";
}

const variantStyles = {
  default: "border-border",
  primary: "border-primary/30 glow-primary",
  accent: "border-accent/30 glow-accent",
  warning: "border-warning/30",
};

const iconVariants = {
  default: "text-muted-foreground",
  primary: "text-primary",
  accent: "text-accent",
  warning: "text-warning",
};

const MetricsCard = ({ icon: Icon, label, value, subtext, variant = "default" }: MetricsCardProps) => (
  <div className={`bg-card rounded-lg border p-4 animate-slide-up ${variantStyles[variant]}`}>
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`w-4 h-4 ${iconVariants[variant]}`} />
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
    <div className="text-2xl font-bold font-mono text-foreground">{value}</div>
    {subtext && <div className="text-xs text-muted-foreground mt-1">{subtext}</div>}
  </div>
);

export default MetricsCard;
