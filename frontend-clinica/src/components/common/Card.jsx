export default function Card({ title, value, subtitle }) {
  return (
    <article className="card">
      <p className="card-title">{title}</p>
      <strong className="card-value">{value}</strong>
      {subtitle ? <p className="card-subtitle">{subtitle}</p> : null}
    </article>
  );
}
