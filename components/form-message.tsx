export type Message =
  | { success: string }
  | { error: string }
  | { message: string };

export function FormMessage({ message }: { message: Message }) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-md text-sm">
      {"success" in message && (
        <div className="text-grass border-l-2 border-grass px-4 py-2  rounded-r-md">
          {message.success}
        </div>
      )}
      {"error" in message && (
        <div className="text-tomato border-l-2 border-tomato px-4 py-2  rounded-r-md">
          {message.error}
        </div>
      )}
      {"message" in message && (
        <div className="text-skyblue border-l-2 border-skyblue px-4 py-2  rounded-r-md">
          {message.message}
        </div>
      )}
    </div>
  );
}
