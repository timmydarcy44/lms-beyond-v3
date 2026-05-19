export default function Page({ params }: { params: { id: string } }) {
  return <div>DASHBOARD TEST OK: {params.id}</div>;
}

