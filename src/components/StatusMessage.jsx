export default function StatusMessage({ message }) {
  return (
    <div className="status-message" role="status">
      <span className="spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
