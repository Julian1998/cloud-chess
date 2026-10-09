export default function ErrorFallback() {
  return (
    <main id="app-content" className="cc-shell">
      <div className="cc-message cc-message--error" role="alert">
        <span>Cloud Chess konnte nicht geladen werden.</span>
        <button type="button" onClick={() => window.location.reload()}>
          Seite neu laden
        </button>
      </div>
    </main>
  );
}
