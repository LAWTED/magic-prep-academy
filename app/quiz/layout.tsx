export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container px-4 max-w-4xl mx-auto pb-20 pt-6">
      {children}
    </div>
  );
}