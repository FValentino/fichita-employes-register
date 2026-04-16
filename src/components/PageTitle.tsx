interface PageTitleProps {
  children: React.ReactNode;
}

export function PageTitle({ children }: PageTitleProps) {
  return (
    <h1
      style={{
        color: "#000000",
        fontSize: "32px",
        fontWeight: "bold",
        marginBottom: "24px",
      }}
    >
      {children}
    </h1>
  );
}
