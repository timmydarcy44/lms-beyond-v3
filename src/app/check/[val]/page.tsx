export default function Page({ params }: { params: { val: string } }) {
  return <div>CHECK OK: {params.val}</div>;
}

