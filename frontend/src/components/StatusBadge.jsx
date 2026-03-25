export default function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-${status}`}>
      {status === 'valid'    && '● VALID'}
      {status === 'tampered' && '⚠ TAMPERED'}
      {status === 'pending'  && '○ PENDING'}
    </span>
  );
}
