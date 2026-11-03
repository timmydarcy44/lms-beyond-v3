export type ReviewEntry = {
  id: string;
  title: string;
  expected: string;
  conceptLabel?: string;
};

export function ReviewList({
  items,
  onReview,
}: {
  items: ReviewEntry[];
  onReview: (id: string) => void;
}) {
  return (
    <section className="result-card" aria-labelledby="a-revoir">
      <h3 id="a-revoir">À revoir</h3>
      {items.length === 0 ? (
        <p>Sans faute, rien à revoir.</p>
      ) : (
        <ul className="review-list">
          {items.map((item) => (
            <li key={item.id}>
              <span className="review-x" aria-hidden>
                ✕
              </span>
              <div>
                <strong>{item.title}</strong>
                <p>Bonne réponse : {item.expected}</p>
              </div>
              <button type="button" onClick={() => onReview(item.id)}>
                Revoir ›
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
