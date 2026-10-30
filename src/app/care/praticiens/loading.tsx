export default function CarePraticiensLoading() {
  return (
    <div className="cf-page">
      <div className="care-wrap cf-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="cf-skeleton" />
        ))}
      </div>
    </div>
  );
}
