/** Shared info (status) + error (alert) lines for the sign-in steps. */
export function FeedbackLines({
  info,
  error,
}: {
  info: string;
  error: string;
}) {
  return (
    <>
      {info ? (
        <p className="text-[12px] font-medium text-ona-success" role="status">
          {info}
        </p>
      ) : null}
      {error ? (
        <p className="text-[12px] font-medium text-ona-danger" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
