import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';

function AnimatedNumber({ value }) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => {
    if (typeof value === 'string' && value.includes('.')) {
      return latest.toFixed(1);
    }
    return Math.round(latest).toLocaleString();
  });

  useEffect(() => {
    const numVal = parseFloat(value) || 0;
    const controls = animate(motionValue, numVal, {
      duration: 1.2,
      ease: 'easeOut',
    });
    return controls.stop;
  }, [value, motionValue]);

  return <motion.span>{rounded}</motion.span>;
}

export default function KpiCard({ title, value, suffix = '', icon: Icon, color = '#714B67', trend, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
      className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden kpi-glow"
      style={{ '--kpi-color': color }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-foreground">
              <AnimatedNumber value={value} />
            </span>
            {suffix && <span className="text-sm font-medium text-muted-foreground/80">{suffix}</span>}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-500'}`}>
              <span>{trend.positive ? '↑' : '↓'}</span>
              <span>{trend.value}%</span>
              <span className="text-muted-foreground/60 font-normal">vs last period</span>
            </div>
          )}
        </div>
        {Icon && (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
