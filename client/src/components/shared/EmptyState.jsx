import { motion } from 'framer-motion';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      {Icon && (
        <div className="w-16 h-16 bg-muted/80 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-muted-foreground/60" />
        </div>
      )}
      <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground/80 text-center max-w-sm mb-6">{description}</p>
      {action}
    </motion.div>
  );
}
