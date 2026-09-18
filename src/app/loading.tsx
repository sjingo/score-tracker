export default function Loading() {
  return (
    <div className="app-loading" role="status" aria-label="Loading">
      <img
        src="/icon-192x192.png"
        alt=""
        width={96}
        height={96}
        className="app-loading-logo"
      />
    </div>
  );
}