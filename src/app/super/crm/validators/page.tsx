import { ValidatorsCrmClient } from "./validators-crm-client";

export default function CrmValidatorsPage() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-6 py-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-white">Validateurs</h1>
        <p className="text-sm text-[#9AA3BD]">
          Experts référencés pour la validation des Open Badges et des formations.
        </p>
      </div>
      <ValidatorsCrmClient />
    </div>
  );
}
