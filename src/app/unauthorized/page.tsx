export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-4 text-center">
      <h1 className="text-2xl font-semibold">Access denied</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Your account doesn&apos;t have permission to view this page. If you believe this
        is a mistake, contact an administrator.
      </p>
      <a href="/dashboard" className="text-sm text-primary underline-offset-4 hover:underline">
        Back to dashboard
      </a>
    </main>
  );
}
