"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto mt-16 text-center">
      <h1 className="text-lg font-semibold mb-2">משהו השתבש</h1>
      <p className="text-sm text-slate-500 mb-4">
        {error.message || "אירעה שגיאה בלתי צפויה. ייתכן שהחיבור למסד הנתונים או ל-Google Sheets עדיין לא הוגדר."}
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
      >
        נסה שוב
      </button>
    </div>
  );
}
