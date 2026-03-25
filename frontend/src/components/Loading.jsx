import '../styles/Loading.css';

// ─────────────────────────────────────────
// 1. Full Page Loading Overlay
// ─────────────────────────────────────────
export function LoadingOverlay({ message = 'Loading' }) {
  return (
    <div className="loading-overlay">
      <div className="loading-box">
        <div className="spinner" />
        <div className="loading-text">
          <span className="loading-dots">{message}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// 2. Inline Spinner (small)
// ─────────────────────────────────────────
export function SpinnerSm() {
  return <span className="spinner-sm" />;
}

// ─────────────────────────────────────────
// 3. Page Skeleton Loader
// ─────────────────────────────────────────
export function PageSkeleton() {
  return (
    <div className="page-skeleton">
      {/* Stats skeleton */}
      <div className="skeleton-stats">
        {[1,2,3,4].map(i => (
          <div key={i} className="skeleton skeleton-stat" />
        ))}
      </div>
      {/* Card skeleton */}
      <div className="skeleton-card">
        <div className="skeleton skeleton-row short" style={{ height: 18, marginBottom: 20 }} />
        <div className="skeleton skeleton-row full"  />
        <div className="skeleton skeleton-row medium" />
        <div className="skeleton skeleton-row full"  />
        <div className="skeleton skeleton-row short" />
      </div>
      <div className="skeleton-card">
        <div className="skeleton skeleton-row short" style={{ height: 18, marginBottom: 20 }} />
        <div className="skeleton skeleton-row full"  />
        <div className="skeleton skeleton-row medium" />
        <div className="skeleton skeleton-row full"  />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// 4. Error Box
// ─────────────────────────────────────────
export function ErrorBox({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="error-box">
      <span className="error-icon">⚠️</span>
      <div className="error-content">
        <div className="error-title">{title}</div>
        <div className="error-message">{message}</div>
        {onRetry && (
          <div className="error-actions">
            <button className="btn btn-outline sm" onClick={onRetry}>
              ↺ Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// 5. Empty State
// ─────────────────────────────────────────
export function EmptyState({ icon = '📂', title, subtitle, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">{icon}</span>
      <div className="empty-state-title">{title}</div>
      {subtitle && <div className="empty-state-sub">{subtitle}</div>}
      {actionLabel && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
