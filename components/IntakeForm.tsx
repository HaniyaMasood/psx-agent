import { startResearch } from "@/app/actions/research";
import { ResearchSubmitButton } from "@/components/ResearchSubmitButton";

const fieldClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500";

export function IntakeForm({ error }: { error?: string }) {
  return (
    <form action={startResearch} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Investment goal
        </label>
        <textarea
          name="goal"
          required
          rows={2}
          defaultValue="Long-term wealth building for retirement"
          className={fieldClass}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">
            Horizon (years)
          </label>
          <input
            name="horizonYears"
            type="number"
            min={1}
            max={40}
            defaultValue={10}
            required
            className={fieldClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">
            Risk tolerance
          </label>
          <select
            name="riskTolerance"
            defaultValue="moderate"
            className={fieldClass}
          >
            <option value="conservative">Conservative</option>
            <option value="moderate">Moderate</option>
            <option value="growth">Growth</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="shariahOnly"
          name="shariahOnly"
          type="checkbox"
          className="h-4 w-4 rounded border-zinc-600"
        />
        <label htmlFor="shariahOnly" className="text-sm text-zinc-300">
          Shariah-compliant stocks only (KMI screening)
        </label>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Sector preferences (comma-separated, optional)
        </label>
        <input
          name="sectorPreferences"
          placeholder="e.g. BANKING, FERTILIZER"
          className={fieldClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Capital (PKR, optional)
        </label>
        <input
          name="capitalPkr"
          type="number"
          min={0}
          placeholder="5000000"
          className={fieldClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Additional notes
        </label>
        <textarea name="notes" rows={2} className={fieldClass} />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <ResearchSubmitButton />
    </form>
  );
}
