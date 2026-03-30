interface ErrorAlertProps {
  message: string;
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
      <div className="flex">
        <div className="flex-shrink-0 text-red-400">&#9888;</div>
        <div className="ml-3">
          <p className="text-sm text-red-700 dark:text-red-400">{message}</p>
        </div>
      </div>
    </div>
  );
}
