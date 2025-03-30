export default function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="w-full bg-background">{children}</div>;
}
