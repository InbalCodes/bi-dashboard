export default function Footer() {
  return (
    <footer className="print:hidden py-4 text-center text-xs text-slate-400 dark:text-slate-600">
      נבנה ע&quot;י{" "}
      <a
        href="https://inbal.solutions"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-slate-600 dark:hover:text-slate-400 hover:underline"
      >
        inbal.solutions
      </a>
    </footer>
  );
}
