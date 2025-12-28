export const StatusIndicator = ({
  status,
}: {
  status: "PENDING" | "APPROVED" | "REJECTED";
}) => {
  const colors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };

  const labels = {
    PENDING: "In behandeling",
    APPROVED: "Goedgekeurd",
    REJECTED: "Afgewezen",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}
    >
      {labels[status]}
    </span>
  );
};
