interface PageTitleProps {
  children: React.ReactNode;
}

export function PageTitle({ children }: PageTitleProps) {
  return (
    <h1 className="w-full text-2xl text-center md:text-3xl md:text-start font-bold text-gray-800 mb-4 md:mb-6">
      {children}
    </h1>
  );
}