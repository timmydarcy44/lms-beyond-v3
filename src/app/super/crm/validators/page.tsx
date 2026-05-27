import { ValidatorsCrmClient } from "./validators-crm-client";

export default function CrmValidatorsPage() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-6 py-8">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">CRM / Validateurs</p>
        <h1 className="text-3xl font-bold text-gray-900">Validateurs</h1>
        <p className="text-sm text-gray-600">
          Experts référencés pour la validation des Open Badges et des formations.
        </p>
      </div>
      <ValidatorsCrmClient />
    </div>
  );
}
