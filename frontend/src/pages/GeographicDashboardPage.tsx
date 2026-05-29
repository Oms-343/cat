import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  getDistrictsOverview,
  getDistrictTaluks,
  getTalukPincodes,
} from "../api/dashboard";
import { listCompanies } from "../api/companies";
import { listEntries } from "../api/masters";
import { ApiError } from "../api/client";
import type {
  DistrictsOverview,
  TalukDrilldown,
  TalukPincodeDrilldown,
} from "../types/dashboard";
import type { CompanyListItem } from "../types/company";
import type { MasterEntry } from "../types/master";
import type { MapRegion } from "../components/maps/mapTypes";
import { regionListDotColor } from "../components/maps/choroplethColors";
import { RegionsListPanel } from "../components/dashboard/RegionsListPanel";
import { GeographicMapBreadcrumbs } from "../components/maps/GeographicMapBreadcrumbs";
import { GeographicMapPanel } from "../components/maps/GeographicMapPanel";
import { PincodeAreaMap } from "../components/maps/PincodeAreaMap";
import {
  findLayoutTaluk,
  getLayoutDistrictKey,
  loadLayoutData,
  loadTalukIndex,
} from "../components/maps/tnLayoutMap";
import {
  DashboardStatCard,
  MsmeCountChartIcon,
} from "../components/dashboard/DashboardStatCard";
import { Alert, PageShell, Select } from "../components/ui";
import { cn } from "../utils/cn";
import { Briefcase, Factory, MapPin, Scale, X } from "lucide-react";

/** Matches backend `UNASSIGNED_TALUK_CODE` — MSMEs in district with no taluk/pincode. */
const UNASSIGNED_TALUK_CODE = "_UNASSIGNED";
const NO_PINCODE_LABEL = "—";

type DrillItem = {
  code: string;
  name: string;
  count: number;
  subtitle?: string;
};

export function GeographicDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const district = searchParams.get("district") ?? "";
  const taluk = searchParams.get("taluk") ?? "";
  const pincode = searchParams.get("pincode") ?? "";
  const sector = searchParams.get("sector") ?? "";
  const turnover = searchParams.get("turnover") ?? "";

  const filters = useMemo(
    () => ({
      sector: sector || undefined,
      turnover: turnover || undefined,
    }),
    [sector, turnover],
  );

  const [masters, setMasters] = useState<{
    districts: MasterEntry[];
    sectors: MasterEntry[];
    turnoverRanges: MasterEntry[];
  } | null>(null);

  const [overview, setOverview] = useState<DistrictsOverview | null>(null);
  const [taluks, setTaluks] = useState<TalukDrilldown | null>(null);
  const [pincodes, setPincodes] = useState<TalukPincodeDrilldown | null>(null);
  const [companies, setCompanies] = useState<CompanyListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [layoutTalukName, setLayoutTalukName] = useState<string | null>(null);

  useEffect(() => {
    if (!district || !taluk) {
      setLayoutTalukName(null);
      return;
    }
    let cancelled = false;
    Promise.all([loadLayoutData(), loadTalukIndex()])
      .then(([layout, index]) => {
        if (cancelled) return;
        const indexName = index.districts[district]?.taluks.find(
          (t) => t.code === taluk,
        )?.name;
        if (indexName) {
          setLayoutTalukName(indexName);
          return;
        }
        const key = getLayoutDistrictKey(district);
        if (!key) return;
        const found = findLayoutTaluk(
          layout.districts[key] ?? [],
          taluk,
          index,
          district,
        );
        if (found) setLayoutTalukName(found.name);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [district, taluk]);

  useEffect(() => {
    Promise.all([
      listEntries("districts", { active: true }),
      listEntries("sectors", { active: true }),
      listEntries("turnover-ranges", { active: true }),
    ])
      .then(([districts, sectors, turnoverRanges]) =>
        setMasters({ districts, sectors, turnoverRanges }),
      )
      .catch((err) =>
        setError(err instanceof ApiError ? err.detail : String(err)),
      );
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    if (district && taluk && pincode) {
      const noPincode = pincode === NO_PINCODE_LABEL;
      listCompanies({
        district,
        ...(noPincode ? {} : { pincode }),
        ...filters,
        limit: 200,
      })
        .then((res) => {
          let items = res.items;
          if (taluk === UNASSIGNED_TALUK_CODE) {
            items = items.filter((c) => !c.taluk_code && !c.pincode);
          } else if (noPincode) {
            items = items.filter((c) => !c.pincode);
          }
          setCompanies(items);
        })
        .catch((err) =>
          setError(err instanceof ApiError ? err.detail : String(err)),
        )
        .finally(() => setLoading(false));
      setOverview(null);
      setTaluks(null);
      setPincodes(null);
    } else if (district && taluk) {
      getTalukPincodes(district, taluk, filters)
        .then(setPincodes)
        .catch((err) => {
          if (err instanceof ApiError && err.status === 404) {
            setPincodes(null);
            return;
          }
          setError(err instanceof ApiError ? err.detail : String(err));
        })
        .finally(() => setLoading(false));
      setOverview(null);
      setTaluks(null);
      setCompanies(null);
    } else if (district) {
      getDistrictTaluks(district, filters)
        .then(setTaluks)
        .catch((err) =>
          setError(err instanceof ApiError ? err.detail : String(err)),
        )
        .finally(() => setLoading(false));
      setOverview(null);
      setPincodes(null);
      setCompanies(null);
    } else {
      getDistrictsOverview(filters)
        .then(setOverview)
        .catch((err) =>
          setError(err instanceof ApiError ? err.detail : String(err)),
        )
        .finally(() => setLoading(false));
      setTaluks(null);
      setPincodes(null);
      setCompanies(null);
    }
  }, [district, taluk, pincode, filters]);

  function updateParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    setSearchParams(next);
  }

  const districtName =
    pincodes?.district_name ??
    taluks?.district_name ??
    masters?.districts.find((d) => d.code === district)?.name ??
    district;

  const talukName =
    taluk === UNASSIGNED_TALUK_CODE
      ? "Unassigned"
      : (pincodes?.taluk_name ?? layoutTalukName ?? taluk);

  let level: "state" | "district" | "taluk" | "pincode" = "state";
  if (district && taluk && pincode) level = "pincode";
  else if (district && taluk) level = "taluk";
  else if (district) level = "district";

  const listItems: DrillItem[] = useMemo(() => {
    if (level === "state" && overview) {
      return overview.items.map((d) => ({
        code: d.code,
        name: d.name,
        count: d.company_count,
        subtitle: d.code,
      }));
    }
    if (level === "district" && taluks) {
      return taluks.items.map((t) => ({
        code: t.code,
        name: t.name,
        count: t.company_count,
      }));
    }
    if (level === "taluk" && pincodes) {
      return pincodes.items.map((p) => ({
        code: p.pincode,
        name: p.pincode,
        count: p.company_count,
        subtitle: "pincode",
      }));
    }
    return [];
  }, [level, overview, taluks, pincodes]);

  const mapRegions: MapRegion[] = listItems.map((i) => ({
    code: i.code,
    name: i.name,
    count: i.count,
  }));

  const maxRegionCount = useMemo(
    () => Math.max(0, ...listItems.map((i) => i.count)),
    [listItems],
  );

  const topRegionInsight = useMemo(() => {
    if (!overview?.items.length) return null;
    const top = [...overview.items].sort(
      (a, b) => b.company_count - a.company_count,
    )[0];
    if (!top || top.company_count === 0) return null;
    return top;
  }, [overview]);

  function onSelectItem(item: DrillItem) {
    if (level === "state")
      updateParams({ district: item.code, taluk: null, pincode: null });
    else if (level === "district")
      updateParams({ taluk: item.code, pincode: null });
    else if (level === "taluk") updateParams({ pincode: item.code });
  }

  const regionsPanelTitle =
    level === "state"
      ? "District Analytics"
      : level === "district"
        ? "Taluk Analytics"
        : "Pincode Analytics";

  const regionsNameColumn =
    level === "state"
      ? "District Name"
      : level === "district"
        ? "Taluk Name"
        : "Pincode";

  return (
    <PageShell className="!py-5">
      <GeographicMapBreadcrumbs
        variant="panel"
        className="mb-1"
        level={level}
        district={district || undefined}
        districtName={districtName}
        taluk={taluk || undefined}
        talukName={talukName}
        pincode={pincode || undefined}
        onNavigate={updateParams}
      />

      <header className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Geographic Dashboard
        </h1>
        <p className="text-sm text-muted mt-1">
          {level === "state" &&
            "An interactive view of micro, small, and medium enterprise distribution across Tamil Nadu districts."}
          {level === "district" && `Taluks in ${districtName}.`}
          {level === "taluk" && `Pincodes in ${talukName}.`}
          {level === "pincode" && `Companies in pincode ${pincode}.`}
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 mb-4 items-stretch">
        <RefinementPanel
          className={
            level === "state" ? "xl:col-span-6" : "xl:col-span-12"
          }
          sector={sector}
          turnover={turnover}
          masters={masters}
          onUpdate={updateParams}
        />
        {level === "state" && (
          <>
            <DashboardStatCard
              className={cn(
                "xl:col-span-3",
                loading && "opacity-60 pointer-events-none",
              )}
              label="Total MSMEs"
              value={
                overview
                  ? overview.total_companies.toLocaleString()
                  : "—"
              }
              icon={<MsmeCountChartIcon />}
              detail={
                overview ? (
                  topRegionInsight ? (
                    <>
                      Led by{" "}
                      <span className="font-semibold text-ink">
                        {topRegionInsight.name} (
                        {topRegionInsight.company_count.toLocaleString()})
                      </span>
                    </>
                  ) : (
                    "No MSMEs in the current filter"
                  )
                ) : (
                  "Loading…"
                )
              }
              footer="Total registered MSMEs"
            />
            <DashboardStatCard
              className={cn(
                "xl:col-span-3",
                loading && "opacity-60 pointer-events-none",
              )}
              label="Active districts"
              value={
                overview
                  ? `${overview.total_districts_with_msmes} of 38`
                  : "—"
              }
              secondaryValue={
                overview
                  ? `${Math.round((overview.total_districts_with_msmes / 38) * 100)}%`
                  : undefined
              }
              icon={<MapPin className="w-8 h-8" strokeWidth={1.5} />}
              footer="Registered MSMEs across all districts."
            />
          </>
        )}
      </div>

      {error && (
        <Alert variant="error" className="mb-3">
          {error}
        </Alert>
      )}

      {level === "pincode" && companies && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[420px]">
          <div className="lg:col-span-1 bg-canvas border border-hairline rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3.5 border-b border-hairline text-sm font-semibold text-ink">
              Companies
            </div>
            <div className="max-h-[480px] overflow-y-auto">
              <CompaniesTable
                companies={companies}
                masters={masters}
                onOpen={(id) => navigate(`/companies/${id}`)}
                embedded
              />
            </div>
          </div>
          <div className="lg:col-span-2">
            <PincodeAreaMap
              pincode={pincode}
              districtName={districtName}
              districtCode={district}
              level={level}
              taluk={taluk || undefined}
              talukName={talukName}
              onNavigate={updateParams}
            />
          </div>
        </div>
      )}

      {level !== "pincode" &&
        (listItems.length > 0 ||
          district ||
          (loading && (overview || taluks || pincodes))) && (
          <div
            className={cn(
              "grid grid-cols-1 lg:grid-cols-3 gap-5 items-start",
              loading && "opacity-60 pointer-events-none",
            )}
            aria-busy={loading}
          >
            <RegionsListPanel
              className="lg:col-span-1"
              title={regionsPanelTitle}
              nameColumnLabel={regionsNameColumn}
              level={level}
              maxRegionCount={maxRegionCount}
              items={listItems.map((item) => ({
                ...item,
                dotColor: regionListDotColor(level, item.count, maxRegionCount),
              }))}
              hoveredCode={hovered}
              onHover={setHovered}
              onSelect={onSelectItem}
              emptyMessage="No regions in the list yet — use the map to explore taluks and pincodes."
            />

            <div className="lg:col-span-2 bg-canvas border border-hairline rounded-xl shadow-sm p-5 min-h-[420px]">
              <GeographicMapPanel
                title={
                  level === "state"
                    ? "Tamil Nadu — click a district"
                    : level === "district"
                      ? `${districtName} — click a taluk`
                      : `${talukName} — MSMEs by pincode`
                }
                regions={mapRegions}
                level={level}
                districtCode={district}
                districtName={districtName}
                talukCode={taluk}
                talukName={talukName}
                hoveredCode={hovered}
                onHover={setHovered}
                onSelectDistrict={(code) =>
                  updateParams({ district: code, taluk: null, pincode: null })
                }
                onSelectTaluk={(code) =>
                  updateParams({ taluk: code, pincode: null })
                }
                onSelectPincode={(pc) => updateParams({ pincode: pc })}
                onNavigate={updateParams}
                onBack={() => {
                  if (level === "taluk")
                    updateParams({ taluk: null, pincode: null });
                  else if (level === "district")
                    updateParams({
                      district: null,
                      taluk: null,
                      pincode: null,
                    });
                }}
                disableEmpty={level === "state"}
              />
            </div>
          </div>
        )}
    </PageShell>
  );
}

function FilterSelect({
  icon: Icon,
  value,
  onChange,
  children,
}: {
  icon: typeof Factory;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative min-w-0">
      <Icon
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none z-10"
        strokeWidth={1.75}
        aria-hidden
      />
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-9 bg-canvas appearance-none cursor-pointer"
      >
        {children}
      </Select>
      <span
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted text-xs"
        aria-hidden
      >
        ▾
      </span>
    </div>
  );
}

function RefinementPanel({
  sector,
  turnover,
  masters,
  onUpdate,
  className,
}: {
  sector: string;
  turnover: string;
  masters: {
    districts: MasterEntry[];
    sectors: MasterEntry[];
    turnoverRanges: MasterEntry[];
  } | null;
  onUpdate: (u: Record<string, string | null>) => void;
  className?: string;
}) {
  const hasFilters = Boolean(sector || turnover);

  const sectorName =
    masters?.sectors.find((s) => s.code === sector)?.name ?? sector;
  const turnoverName =
    masters?.turnoverRanges.find((t) => t.code === turnover)?.name ?? turnover;

  const activeTags = [
    sector && {
      key: "sector" as const,
      icon: Briefcase,
      label: sectorName,
      onRemove: () => onUpdate({ sector: null }),
    },
    turnover && {
      key: "turnover" as const,
      icon: Scale,
      label: turnoverName,
      onRemove: () => onUpdate({ turnover: null }),
    },
  ].filter(Boolean) as {
    key: "sector" | "turnover";
    icon: typeof Briefcase;
    label: string;
    onRemove: () => void;
  }[];

  return (
    <div
      className={cn(
        "bg-canvas border border-hairline rounded-xl shadow-sm p-3 sm:p-3.5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2 min-h-[1.25rem]">
        <p className="text-sm font-semibold text-ink">
          Sector & turnover filters
        </p>
        <button
          type="button"
          onClick={() => onUpdate({ sector: null, turnover: null })}
          disabled={!hasFilters}
          className={cn(
            "text-xs text-brand-accent hover:underline font-medium shrink-0",
            !hasFilters && "invisible",
          )}
        >
          clear filters
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <FilterSelect
          icon={Briefcase}
          value={sector}
          onChange={(v) => onUpdate({ sector: v || null })}
        >
          <option value="">All sectors</option>
          {masters?.sectors.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          icon={Scale}
          value={turnover}
          onChange={(v) => onUpdate({ turnover: v || null })}
        >
          <option value="">All turnover ranges</option>
          {masters?.turnoverRanges.map((t) => (
            <option key={t.code} value={t.code}>
              {t.name}
            </option>
          ))}
        </FilterSelect>
      </div>

      <div
        className={cn(
          "flex flex-wrap items-center gap-1.5 mt-2.5 min-h-[1.875rem]",
          activeTags.length === 0 && "invisible",
        )}
        aria-hidden={activeTags.length === 0}
      >
        {activeTags.map(({ key, icon: TagIcon, label, onRemove }) => (
          <span
            key={key}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-accent/25 bg-brand-accent/10 pl-2.5 pr-1.5 py-1 text-xs font-medium text-brand-accent"
          >
            <TagIcon className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden />
            <span className="max-w-[180px] truncate">{label}</span>
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${label} filter`}
              className="grid place-items-center w-4 h-4 rounded-full text-brand-accent/70 hover:bg-brand-accent/20 hover:text-brand-accent transition-colors"
            >
              <X className="w-3 h-3" strokeWidth={2.25} aria-hidden />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function CompaniesTable({
  companies,
  masters,
  onOpen,
  embedded = false,
}: {
  companies: CompanyListItem[];
  masters: { sectors: MasterEntry[]; turnoverRanges: MasterEntry[] } | null;
  onOpen: (id: number) => void;
  embedded?: boolean;
}) {
  return (
    <div
      className={
        embedded ? "" : "rounded-lg border border-hairline overflow-hidden"
      }
    >
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-slate-500 bg-slate-50 border-b">
          <tr>
            <th className="py-2 px-4">Name</th>
            <th className="py-2 px-4">Sector</th>
            <th className="py-2 px-4">Turnover</th>
            <th className="py-2 px-4">Completion</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => (
            <tr
              key={c.id}
              className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
              onClick={() => onOpen(c.id)}
            >
              <td className="py-2 px-4 font-medium">{c.name}</td>
              <td className="py-2 px-4">
                {masters?.sectors.find((s) => s.code === c.sector_code)?.name ??
                  c.sector_code ??
                  "—"}
              </td>
              <td className="py-2 px-4">
                {masters?.turnoverRanges.find(
                  (t) => t.code === c.turnover_range_code,
                )?.name ?? "—"}
              </td>
              <td className="py-2 px-4">{c.profile_completion}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
