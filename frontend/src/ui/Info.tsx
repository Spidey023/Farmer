type InfoProps = {
  label: string;
  value?: React.ReactNode;
};

const Info = ({ label, value }: InfoProps) => {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
};

export default Info;
