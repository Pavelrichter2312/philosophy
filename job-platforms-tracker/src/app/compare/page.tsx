import { COMPANY_IDS } from '@/lib/companies';
import { readCompany } from '@/lib/data';
import Comparator from '@/components/compare/Comparator';

export const revalidate = 43200;

export default async function ComparePage() {
  const companies = COMPANY_IDS
    .map((id) => readCompany(id))
    .filter((c): c is NonNullable<typeof c> => c !== null);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-medium text-ink mb-2">Compare</h1>
        <p className="text-[13px] text-ink-muted max-w-lg">
          Compare financial metrics across job platforms. Use base-year indexing to normalize growth trajectories.
        </p>
      </div>
      <Comparator companies={companies} />
    </div>
  );
}
