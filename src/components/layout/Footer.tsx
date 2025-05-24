export function Footer() {
  return (
    <footer className="py-4 text-xs">
      <div className="flex items-center justify-center px-4">
        <div className="text-muted-foreground flex items-center justify-center gap-3 font-medium uppercase">
          <span>© {new Date().getFullYear()} Hair Makeover Generator</span>
        </div>
      </div>
    </footer>
  );
}
