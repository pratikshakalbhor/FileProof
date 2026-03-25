import '../styles/NotFound.css';

export default function NotFound({ onNavigate }) {
  return (
    <div className="notfound-page">

      <div className="notfound-icon">🔐</div>

      <div className="notfound-code">404</div>

      <div className="notfound-title">Page Not Found</div>

      <div className="notfound-sub">
        The page you're looking for doesn't exist or has been moved.{'\n'}
        Your blockchain records are still safe!
      </div>

      <div className="notfound-actions">
        <button
          className="btn btn-primary"
          onClick={() => onNavigate('dashboard')}
        >
          🏠 Go to Dashboard
        </button>
        <button
          className="btn btn-outline"
          onClick={() => onNavigate('upload')}
        >
          🔒 Upload File
        </button>
      </div>

    </div>
  );
}
