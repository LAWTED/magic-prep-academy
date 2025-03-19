export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] p-8 w-full">
      {children}
    </div>
  );
}
