import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center">
      <p className="text-lg font-semibold">Pagina niet gevonden</p>
      <p className="mt-1 text-muted">Deze pagina bestaat niet (meer).</p>
      <Link href="/bibliotheek/" className="mt-4 inline-block font-medium text-accent">
        Naar de bibliotheek
      </Link>
    </div>
  );
}
