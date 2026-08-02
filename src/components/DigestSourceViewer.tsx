"use client";

export default function DigestSourceViewer({ digest }: { digest: unknown }) {
  return (
    <details className="mt-4">
      <summary className="cursor-pointer text-sm text-blue-600">
        הצגת הנתונים שעליהם מבוסס הניתוח
      </summary>
      <pre className="mt-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-md p-3 overflow-auto max-h-96 whitespace-pre-wrap" dir="ltr">
        {JSON.stringify(digest, null, 2)}
      </pre>
    </details>
  );
}
