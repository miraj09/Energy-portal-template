type TableHeadProps = {
  heads: string[];
};

export default function TableHead({ heads }: TableHeadProps) {
  return (
    <thead className="bg-primary text-primary-foreground">
      <tr>
        {heads.map((head) => (
          <th key={head} className="px-4 py-3 text-left text-xs font-semibold">
            {head}
          </th>
        ))}
      </tr>
    </thead>
  );
}
