
import React, { useEffect, useMemo, useRef, useState } from "react";

const buildSearchUrl = ({ title, author, subject, isbn, page }) => {
  const params = new URLSearchParams();
  if (title) params.set("title", title.trim());
  if (author) params.set("author", author.trim());
  if (subject) params.set("subject", subject.trim());
  if (isbn) params.set("isbn", isbn.trim());
  if (![title, author, subject, isbn].some(Boolean)) params.set("q", "*");
  params.set("limit", "20");
  if (page && page > 1) params.set("page", String(page));
  return `https://openlibrary.org/search.json?${params.toString()}`;
};

const coverUrl = (doc, size = "M") => {
  if (doc?.cover_i) return `https://covers.openlibrary.org/b/id/${doc.cover_i}-${size}.jpg`;
  const isbn = doc?.isbn?.[0];
  if (isbn) return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg`;
  return null;
};

const workUrl = (doc) => (doc?.key ? `https://openlibrary.org${doc.key}` : undefined);
const authorUrls = (doc) => {
  const authorKeys = doc?.author_key || [];
  return authorKeys.map((k) => `https://openlibrary.org/authors/${k}`);
};

const Pill = ({ children }) => (
  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-gray-700 bg-white/60 border-gray-200">
    {children}
  </span>
);

const Label = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
    {children}
  </label>
);

const Input = ({ id, ...props }) => (
  <input
    id={id}
    className="w-full rounded-2xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-200 bg-white/70"
    {...props}
  />
);

const Button = ({ children, className = "", ...props }) => (
  <button
    className={`rounded-2xl px-4 py-2 shadow-sm border border-transparent bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const GhostButton = ({ children, className = "", ...props }) => (
  <button
    className={`rounded-2xl px-3 py-2 border bg-white/70 text-gray-700 hover:bg-white ${className}`}
    {...props}
  >
    {children}
  </button>
);

const BookCard = ({ doc, onOpen }) => {
  const url = coverUrl(doc, "M");
  return (
    <div className="group bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="aspect-[3/4] bg-gray-50 flex items-center justify-center overflow-hidden">
        {url ? (
          <img
            src={url}
            alt={`${doc.title} cover`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="text-center p-6 text-gray-400 text-sm">No cover</div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1">
        <h3 className="font-semibold leading-tight line-clamp-2">{doc.title}</h3>
        <p className="text-sm text-gray-600 line-clamp-1">
          {(doc.author_name || []).join(", ") || "Unknown author"}
        </p>
        <div className="mt-1 text-xs text-gray-500">{doc.first_publish_year || "—"}</div>
        <div className="mt-2 flex gap-2">
          <GhostButton onClick={() => onOpen(doc)}>Details</GhostButton>
          {workUrl(doc) && (
            <a className="rounded-2xl px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-sm" href={workUrl(doc)} target="_blank" rel="noreferrer">
              Open Library
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const Modal = ({ open, onClose, doc }) => {
  const dialogRef = useRef(null);
  useEffect(() => {
    if (open) {
      const onEsc = (e) => e.key === "Escape" && onClose();
      window.addEventListener("keydown", onEsc);
      return () => window.removeEventListener("keydown", onEsc);
    }
  }, [open, onClose]);

  if (!open || !doc) return null;
  const authors = doc.author_name || [];
  const urls = authorUrls(doc);
  const subjects = (doc.subject || []).slice(0, 8);
  const largeCover = coverUrl(doc, "L");

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div ref={dialogRef} className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-xl">
        <div className="flex gap-4 p-4 md:p-6">
          <div className="w-32 sm:w-40 md:w-48 shrink-0 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
            {largeCover ? (
              <img src={largeCover} alt={`${doc.title} cover large`} className="w-full h-full object-cover" />
            ) : (
              <div className="text-gray-400 text-sm p-4">No cover</div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold mb-1">{doc.title}</h2>
            <p className="text-sm text-gray-700 mb-2">
              {authors.length ? (
                <>
                  by {authors.map((a, i) => (
                    <span key={i} className="">
                      {i > 0 ? ", " : ""}
                      {urls[i] ? (
                        <a className="text-indigo-600 hover:underline" href={urls[i]} target="_blank" rel="noreferrer">
                          {a}
                        </a>
                      ) : (
                        a
                      )}
                    </span>
                  ))}
                </>
              ) : (
                "Unknown author"
              )}
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              {subjects.map((s, i) => (
                <span key={i} className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-gray-700 bg-white/60 border-gray-200">{s}</span>
              ))}
            </div>

            <dl className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-gray-500">First published</dt>
                <dd className="font-medium">{doc.first_publish_year || "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Edition count</dt>
                <dd className="font-medium">{doc.edition_count || "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Language(s)</dt>
                <dd className="font-medium">{(doc.language || []).join(", ") || "—"}</dd>
              </div>
            </dl>

            <div className="mt-4 flex gap-2 flex-wrap">
              {workUrl(doc) && (
                <a className="rounded-2xl px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700" href={workUrl(doc)} target="_blank" rel="noreferrer">
                  View on Open Library
                </a>
              )}
              {doc?.id_amazon && (
                <a className="rounded-2xl px-4 py-2 border bg-white/70" href={`https://www.amazon.com/s?k=${encodeURIComponent(doc.title)}`} target="_blank" rel="noreferrer">
                  Search on Amazon
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 border-t flex justify-end">
          <GhostButton onClick={onClose}>Close</GhostButton>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [subject, setSubject] = useState("");
  const [isbn, setIsbn] = useState("");

  const [results, setResults] = useState([]);
  const [numFound, setNumFound] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [openDoc, setOpenDoc] = useState(null);

  const url = useMemo(() => buildSearchUrl({ title, author, subject, isbn, page }), [title, author, subject, isbn, page]);

  const runSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      setResults(data.docs || []);
      setNumFound(data.numFound || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e) => {
    e?.preventDefault();
    setPage(1);
    setTimeout(() => runSearch(), 0);
  };

  useEffect(() => {
    if (results.length === 0 && page === 1 && !title && !author && !subject && !isbn) {
      runSearch();
    }
  }, [page]);

  const totalPages = Math.min(50, Math.ceil(numFound / 20));

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/70 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-indigo-600 text-white grid place-content-center font-bold">BF</div>
            <div>
              <h1 className="font-bold leading-tight">Book Finder</h1>
              <p className="text-xs text-gray-600">for Alex · Open Library</p>
            </div>
          </div>
          <a
            href="https://openlibrary.org/developers/api"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-indigo-700 hover:underline"
          >
            Open Library API Docs
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <form onSubmit={onSubmit} className="bg-white rounded-3xl border p-4 md:p-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="e.g., Operating System Concepts" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="author">Author</Label>
              <Input id="author" placeholder="e.g., Silberschatz" value={author} onChange={(e) => setAuthor(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="e.g., algorithms" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="isbn">ISBN</Label>
              <Input id="isbn" placeholder="e.g., 0131103628" value={isbn} onChange={(e) => setIsbn(e.target.value)} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="submit">Search</Button>
            <GhostButton
              type="button"
              onClick={() => {
                setTitle("");
                setAuthor("");
                setSubject("");
                setIsbn("");
                setPage(1);
                setTimeout(() => runSearch(), 0);
              }}
            >
              Clear
            </GhostButton>
          </div>
          <p className="mt-2 text-xs text-gray-600">Tip: You can combine fields. Try title="clean code" and author="martin".</p>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-700">
          <div>
            {loading ? (
              <span>Loading…</span>
            ) : error ? (
              <span className="text-red-600">{error}</span>
            ) : (
              <span>
                Showing <strong>{results.length}</strong> of {numFound.toLocaleString()} result{numFound === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <GhostButton
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={loading || page <= 1}
            >
              Prev
            </GhostButton>
            <span className="text-gray-600">
              Page {page} / {totalPages || 1}
            </span>
            <GhostButton
              onClick={() => setPage((p) => p + 1)}
              disabled={loading || page >= totalPages}
            >
              Next
            </GhostButton>
          </div>
        </div>

        <section className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {results.map((doc, i) => (
            <BookCard key={`${doc.key}-${i}`} doc={doc} onOpen={setOpenDoc} />
          ))}
        </section>

        {!loading && results.length === 0 && (
          <div className="mt-10 text-center text-gray-600">
            <p className="text-lg font-medium">No results yet</p>
            <p className="text-sm">Try searching by title, author, subject, or ISBN.</p>
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-4 pb-10 pt-6 text-xs text-gray-500">
        <p>
          Built with ❤ in React · Data by Open Library. This student-friendly interface is optimized for mobile and desktop.
        </p>
      </footer>

      <Modal open={!!openDoc} onClose={() => setOpenDoc(null)} doc={openDoc} />
    </div>
  );
}
