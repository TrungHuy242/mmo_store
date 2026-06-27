export default function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  className = '',
}) {
  const variants = {
    default: '',
    pills: 'bg-bg-tertiary p-1 rounded-lg',
    underline: 'border-b border-border',
  };

  const tabVariants = {
    default: (isActive) => `
      px-4 py-2.5 text-sm font-medium rounded-lg transition-colors
      ${isActive ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'}
    `,
    pills: (isActive) => `
      px-4 py-2 text-sm font-medium rounded-md transition-colors
      ${isActive ? 'bg-bg-secondary text-text-primary shadow-soft-sm' : 'text-text-secondary hover:text-text-primary'}
    `,
    underline: (isActive) => `
      px-4 py-3 text-sm font-medium border-b-2 transition-colors
      ${isActive ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'}
    `,
  };

  return (
    <div className={`${variants[variant]} ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            ${tabVariants[variant](activeTab === tab.id)}
            ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          disabled={tab.disabled}
        >
          {tab.icon && <span className="mr-2">{tab.icon}</span>}
          {tab.label}
          {tab.count !== undefined && (
            <span className={`
              ml-2 px-1.5 py-0.5 text-xs rounded
              ${activeTab === tab.id ? 'bg-white/20' : 'bg-bg-tertiary'}
            `}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
