type Props = {
  children: React.ReactNode;
  className?: string;
};

const Badge = ({ children, className = "" }: Props) => {
  return (
    <span
      className={`text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-700 ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
