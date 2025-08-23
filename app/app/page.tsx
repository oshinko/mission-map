export default function Page() {
  return (
    <main>
      <p>{process.env.DATABASE_URL}</p>
      <p>{process.env.GREET}</p>
    </main>
  );
}