type ErrorMessageProps = {
  title: string;
  message?: string;
  type?: "error" | "warning";
};

export default function ErrorMessage({
  title,
  message,
  type = "error",
}: ErrorMessageProps) {
  return (
    <div
      className={`rounded-md border p-4 ${
        type === "error"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-yellow-200 bg-yellow-50 text-yellow-800"
      }`}
    >
      <h3 className="text-sm font-semibold">{title}</h3>
      {message ? <p className="mt-1 text-sm">{message}</p> : null}
    </div>
  );
}
