import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';
import { useCostStore } from '../store/useCostStore';
import { MOCVDConfig, BakeConfig, ShipmentConfig } from '../types';
import {
  formatKRW,
  calcMOCVDCostPerRun,
  calcBakeCostPerRun,
  calcMeasurementCostPerRun,
  calcShipmentCostPerRun,
  calcSingleMeasurementCostPerRun,
} from '../utils/calculations';

type Tab = 'mocvd' | 'bake' | 'measurement' | 'shipment';

// ─── 공통 헬퍼 ────────────────────────────────────────────────────
function NumField({
  label, value, unit, step = '1', min = 0, max, onChange,
}: {
  label: string; value: number; unit: string; step?: string;
  min?: number; max?: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="bg-white dark:bg-slate-700 dark:text-slate-100 dark:border-slate-500 border border-gray-200 rounded-lg px-3 py-2 w-full text-right pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
          min={min} max={max} step={step}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-xs">{unit}</span>
      </div>
    </div>
  );
}

function GroupHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1 h-4 bg-gray-300 dark:bg-slate-500 rounded-full" />
      <span className="text-xs font-semibold text-gray-500 dark:text-slate-300 uppercase tracking-wider">{title}</span>
    </div>
  );
}

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#111827',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.12)',
    padding: '8px 12px',
  },
  labelStyle: { color: '#374151', fontWeight: 600 as const },
  itemStyle: { color: '#374151' },
  cursor: { fill: 'rgba(100,116,139,0.06)' },
  allowEscapeViewBox: { x: true, y: true },
};

// ─── 공정 비교 개요 차트 (탭 위 상단) ─────────────────────────────
function ProcessOverviewChart() {
  const { mocvd, bake, measurements, shipment } = useCostStore();
  const wpr = mocvd.wafersPerRun;
  const div = (v: number) => wpr > 0 ? Math.round(v / wpr) : 0;

  const mocvdC = calcMOCVDCostPerRun(mocvd);
  const bakeC = calcBakeCostPerRun(bake, wpr);
  const measC = calcMeasurementCostPerRun(measurements, wpr);
  const shipC = calcShipmentCostPerRun(shipment, wpr);

  const data = [
    {
      name: 'MOCVD',
      노무비: div(mocvdC.labor),
      장비비: div(mocvdC.equipment),
      '유지·청소': div(mocvdC.maintenance + mocvdC.cleaning),
      전력비: div(mocvdC.power),
    },
    {
      name: '베이크',
      노무비: div(bakeC.labor),
      장비비: div(bakeC.equipment),
      '유지·청소': div(bakeC.maintenance),
    },
    {
      name: '측정',
      노무비: div(measC.labor),
      장비비: div(measC.equipment),
    },
    {
      name: '출하',
      노무비: div(shipC.labor),
      재료비: div(shipC.material),
      장비비: div(shipC.equipment),
    },
  ];

  const total = data.reduce((sum, d) => {
    const t = (d.노무비 || 0) + (d.장비비 || 0) + (d['유지·청소'] || 0) + (d.전력비 || 0) + (d.재료비 || 0);
    return sum + t;
  }, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100">공정별 웨이퍼당 원가 비교</h3>
          <p className="text-xs text-gray-400 dark:text-slate-400 mt-0.5">설정 변경 시 실시간 업데이트</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 dark:text-slate-400">4공정 합계</div>
          <div className="text-lg font-bold text-gray-800 dark:text-slate-100 font-mono">{formatKRW(total)} 원/매</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
          <XAxis
            type="number"
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickLine={false}
          />
          <YAxis type="category" dataKey="name" width={42} tick={{ fontSize: 12, fontWeight: 600, fill: '#374151' }} axisLine={false} tickLine={false} />
          <Tooltip
            {...CHART_TOOLTIP_STYLE}
            formatter={(v: number, name: string) => [`${formatKRW(v)} 원`, name]}
            labelFormatter={(l) => `${l} 공정`}
          />
          <Bar dataKey="노무비" stackId="a" fill="#3b82f6" />
          <Bar dataKey="장비비" stackId="a" fill="#f59e0b" />
          <Bar dataKey="유지·청소" stackId="a" fill="#8b5cf6" />
          <Bar dataKey="전력비" stackId="a" fill="#10b981" />
          <Bar dataKey="재료비" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="flex gap-3 flex-wrap mt-2">
        {[
          { color: '#3b82f6', label: '노무비' }, { color: '#f59e0b', label: '장비비' },
          { color: '#8b5cf6', label: '유지·청소' }, { color: '#10b981', label: '전력비' },
          { color: '#ef4444', label: '재료비' },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
            <span className="text-xs text-gray-500 dark:text-slate-400">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 스티키 차트 패널 공통 래퍼 ───────────────────────────────────
function StickyChartPanel({ title, highlight, children }: {
  title: string; highlight: string; children: React.ReactNode;
}) {
  return (
    <div className="sticky top-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{title}</h4>
        <div className="text-xl font-bold text-gray-800 dark:text-slate-100 font-mono mt-0.5">{highlight}</div>
      </div>
      {children}
    </div>
  );
}

// ─── 간단 가로 바 차트 (공정 원가 항목) ──────────────────────────
function CostBarChart({
  data, height = 200,
}: {
  data: { name: string; value: number; fill: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
        <XAxis
          type="number"
          tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
          tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false}
        />
        <YAxis type="category" dataKey="name" width={52} tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} />
        <Tooltip
          {...CHART_TOOLTIP_STYLE}
          formatter={(v: number) => [`${formatKRW(v)} 원`, '원가']}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── 다크 결과 요약 바 ────────────────────────────────────────────
function DarkSummary({ items, total, label }: {
  items: { label: string; value: number; color?: string }[];
  total: { label: string; value: number; accentColor: string };
  label: string;
}) {
  return (
    <div className="bg-slate-800 rounded-xl p-5">
      <p className="text-xs text-slate-400 mb-3 font-semibold uppercase tracking-wider">{label}</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {items.map((item) => (
          <div key={item.label} className="text-center p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-xs text-slate-400 mb-1">{item.label}</div>
            <div className="font-bold font-mono text-sm text-white">{formatKRW(item.value)}원</div>
          </div>
        ))}
        <div
          className="text-center p-3 rounded-lg col-span-2 md:col-span-1"
          style={{ backgroundColor: total.accentColor + '33', border: `1px solid ${total.accentColor}55` }}
        >
          <div className="text-xs mb-1" style={{ color: total.accentColor + 'cc' }}>{total.label}</div>
          <div className="font-bold font-mono text-lg" style={{ color: total.accentColor }}>{formatKRW(total.value)}원</div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 1. MOCVD 탭
// ════════════════════════════════════════════════════════════════
function MOCVDTab() {
  const { mocvd, setMocvd } = useCostStore();
  const cost = calcMOCVDCostPerRun(mocvd);
  const totalPerRun = cost.labor + cost.equipment + cost.maintenance + cost.cleaning + cost.power;
  const totalPerWafer = mocvd.wafersPerRun > 0 ? totalPerRun / mocvd.wafersPerRun : 0;

  const set = (key: keyof MOCVDConfig) => (v: number) => setMocvd({ [key]: v });

  const chartData = useMemo(() => [
    { name: '노무비', value: Math.round(cost.labor), fill: '#3b82f6' },
    { name: '장비비', value: Math.round(cost.equipment), fill: '#f59e0b' },
    { name: '유지보수', value: Math.round(cost.maintenance), fill: '#8b5cf6' },
    { name: '전력비', value: Math.round(cost.power), fill: '#10b981' },
    { name: '청소비', value: Math.round(cost.cleaning), fill: '#f97316' },
  ], [cost]);

  const pieData = useMemo(() => chartData.filter(d => d.value > 0), [chartData]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 왼쪽: 설정 */}
        <div className="xl:col-span-2 space-y-5">
          <div className="bg-gray-50 dark:bg-slate-800/60 rounded-xl p-5">
            <GroupHeader title="기본 공정 파라미터" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <NumField label="1런당 웨이퍼 수" value={mocvd.wafersPerRun} unit="매" onChange={set('wafersPerRun')} />
              <NumField label="성장 시간" value={mocvd.runTimeSec} unit="초" onChange={set('runTimeSec')} />
              <NumField label="셋업 시간" value={mocvd.setupTimeSec} unit="초" onChange={set('setupTimeSec')} />
              <NumField label="리액터 수" value={mocvd.reactorCount} unit="대" onChange={set('reactorCount')} />
              <NumField label="불량률" value={mocvd.defectRate} unit="%" step="0.1" max={100} onChange={set('defectRate')} />
              <NumField label="장비 가동률" value={mocvd.utilizationRate} unit="%" step="1" max={100} onChange={set('utilizationRate')} />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-slate-800/60 rounded-xl p-5">
            <GroupHeader title="인건비" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <NumField label="작업자 수" value={mocvd.workers} unit="명" onChange={set('workers')} />
              <NumField label="시급" value={mocvd.hourlyWage} unit="원" onChange={set('hourlyWage')} />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-slate-800/60 rounded-xl p-5">
            <GroupHeader title="장비비 및 유지보수" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <NumField label="장비 시간당 비용" value={mocvd.equipmentCostPerHour} unit="원/h" onChange={set('equipmentCostPerHour')} />
              <NumField label="런당 유지보수비" value={mocvd.maintenanceCostPerRun} unit="원" onChange={set('maintenanceCostPerRun')} />
              <NumField label="전력 소비" value={mocvd.powerConsumptionKW} unit="kW" onChange={set('powerConsumptionKW')} />
              <NumField label="전기 요금" value={mocvd.electricityRate} unit="원/kWh" onChange={set('electricityRate')} />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-slate-800/60 rounded-xl p-5">
            <GroupHeader title="리액터 청소 관리" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <NumField label="청소 주기" value={mocvd.cleaningIntervalRuns} unit="런마다" onChange={set('cleaningIntervalRuns')} />
              <NumField label="청소 소요 시간" value={mocvd.cleaningTimeSec} unit="초" onChange={set('cleaningTimeSec')} />
              <NumField label="청소 1회 비용" value={mocvd.cleaningCostPerSession} unit="원" onChange={set('cleaningCostPerSession')} />
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
              런당 청소비 배분: {formatKRW(mocvd.cleaningIntervalRuns > 0 ? mocvd.cleaningCostPerSession / mocvd.cleaningIntervalRuns : 0)} 원
            </p>
          </div>
        </div>

        {/* 오른쪽: 실시간 차트 (sticky) */}
        <div className="xl:col-span-1">
          <StickyChartPanel title="실시간 원가 분석" highlight={`${formatKRW(totalPerWafer)} 원/매`}>
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-400 mb-2 font-medium">런당 원가 구성</p>
              <CostBarChart data={chartData} height={180} />
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-400 mb-2 font-medium">원가 비율</p>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={pieData} dataKey="value"
                    cx="50%" cy="50%" innerRadius={38} outerRadius={60}
                    paddingAngle={2}
                  >
                    {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip
                    {...CHART_TOOLTIP_STYLE}
                    formatter={(v: number, name: string) => [`${formatKRW(v)} 원`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: d.fill }} />
                    <span className="text-xs text-gray-500 dark:text-slate-400">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
              <div className="text-center">
                <div className="text-xs text-gray-400 dark:text-slate-400">런당 합계</div>
                <div className="text-sm font-bold font-mono text-gray-800 dark:text-slate-100">{formatKRW(totalPerRun)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 dark:text-slate-400">총 시간</div>
                <div className="text-sm font-bold font-mono text-gray-800 dark:text-slate-100">
                  {((mocvd.runTimeSec + mocvd.setupTimeSec) / 3600).toFixed(1)}h
                </div>
              </div>
            </div>
          </StickyChartPanel>
        </div>
      </div>

      <DarkSummary
        items={[
          { label: '런당 노무비', value: cost.labor },
          { label: '런당 장비비', value: cost.equipment },
          { label: '런당 유지보수', value: cost.maintenance },
          { label: '런당 전력비', value: cost.power },
          { label: '런당 청소비', value: cost.cleaning },
        ]}
        total={{ label: '웨이퍼당 MOCVD 원가', value: totalPerWafer, accentColor: '#60a5fa' }}
        label="런당 원가 분석"
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 2. 베이크 탭
// ════════════════════════════════════════════════════════════════
function BakeTab() {
  const { bake, mocvd, setBake } = useCostStore();
  const cost = calcBakeCostPerRun(bake, mocvd.wafersPerRun);
  const totalPerRun = cost.labor + cost.equipment + cost.maintenance;
  const totalPerWafer = mocvd.wafersPerRun > 0 ? totalPerRun / mocvd.wafersPerRun : 0;
  const set = (key: keyof BakeConfig) => (v: number) => setBake({ [key]: v });

  const totalTimeSec = bake.loadingTimePerRunSec + bake.bakeTimePerWaferSec * mocvd.wafersPerRun + bake.cooldownTimeSec;
  const timeData = useMemo(() => [
    { name: '로딩', value: bake.loadingTimePerRunSec, fill: '#94a3b8' },
    { name: '베이크', value: bake.bakeTimePerWaferSec * mocvd.wafersPerRun, fill: '#f97316' },
    { name: '냉각', value: bake.cooldownTimeSec, fill: '#6b7280' },
  ], [bake, mocvd.wafersPerRun]);

  const costData = useMemo(() => [
    { name: '노무비', value: Math.round(cost.labor), fill: '#3b82f6' },
    { name: '장비비', value: Math.round(cost.equipment), fill: '#f59e0b' },
    { name: '유지보수', value: Math.round(cost.maintenance), fill: '#8b5cf6' },
  ], [cost]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-5">
          <div className="bg-gray-50 dark:bg-slate-800/60 rounded-xl p-5">
            <GroupHeader title="공정 파라미터" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <NumField label="베이크 시간/매" value={bake.bakeTimePerWaferSec} unit="초" onChange={set('bakeTimePerWaferSec')} />
              <NumField label="로딩 시간/런" value={bake.loadingTimePerRunSec} unit="초" onChange={set('loadingTimePerRunSec')} />
              <NumField label="냉각 시간/런" value={bake.cooldownTimeSec} unit="초" onChange={set('cooldownTimeSec')} />
              <NumField label="베이크 온도" value={bake.bakeTemperatureDegC} unit="°C" onChange={set('bakeTemperatureDegC')} />
              <NumField label="로 수" value={bake.furnaceCount} unit="대" onChange={set('furnaceCount')} />
            </div>
            <div className="mt-3 p-3 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 text-xs text-gray-500 dark:text-slate-300">
              런당 총 처리 시간:{' '}
              <strong className="text-gray-700">
                {Math.floor(totalTimeSec / 3600)}시간 {Math.floor((totalTimeSec % 3600) / 60)}분
              </strong>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-slate-800/60 rounded-xl p-5">
            <GroupHeader title="인건비" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <NumField label="작업자 수" value={bake.workers} unit="명" onChange={set('workers')} />
              <NumField label="시급" value={bake.hourlyWage} unit="원" onChange={set('hourlyWage')} />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-slate-800/60 rounded-xl p-5">
            <GroupHeader title="장비비 및 유지보수" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <NumField label="장비 시간당 비용" value={bake.equipmentCostPerHour} unit="원/h" onChange={set('equipmentCostPerHour')} />
              <NumField label="런당 유지보수비" value={bake.maintenanceCostPerRun} unit="원" onChange={set('maintenanceCostPerRun')} />
            </div>
          </div>
        </div>

        <div className="xl:col-span-1">
          <StickyChartPanel title="실시간 원가 분석" highlight={`${formatKRW(totalPerWafer)} 원/매`}>
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-400 mb-2 font-medium">원가 구성</p>
              <CostBarChart data={costData} height={150} />
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-400 mb-2 font-medium">시간 구성 (초)</p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={[{ name: '총 시간' }]} layout="vertical" margin={{ left: 0, right: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" hide />
                  <Tooltip
                    {...CHART_TOOLTIP_STYLE}
                    formatter={(v: number, name: string) => [`${Math.round(v / 60)}분`, name]}
                  />
                  {timeData.map((d) => (
                    <Bar key={d.name} dataKey={() => d.value} stackId="t" name={d.name} fill={d.fill} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-2 flex-wrap mt-1">
                {timeData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: d.fill }} />
                    <span className="text-xs text-gray-500 dark:text-slate-400">{d.name} {Math.round(d.value / 60)}분</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-slate-700 text-center">
              <div className="text-xs text-gray-400 dark:text-slate-400">런당 합계</div>
              <div className="text-sm font-bold font-mono text-gray-800 dark:text-slate-100">{formatKRW(totalPerRun)}</div>
            </div>
          </StickyChartPanel>
        </div>
      </div>

      <DarkSummary
        items={[
          { label: '런당 노무비', value: cost.labor },
          { label: '런당 장비비', value: cost.equipment },
          { label: '런당 유지보수', value: cost.maintenance },
        ]}
        total={{ label: '웨이퍼당 베이크 원가', value: totalPerWafer, accentColor: '#fb923c' }}
        label="런당 원가 분석"
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 3. 측정 탭
// ════════════════════════════════════════════════════════════════
function MeasurementTab() {
  const { measurements, mocvd, addMeasurement, updateMeasurement, removeMeasurement } = useCostStore();
  const cost = calcMeasurementCostPerRun(measurements, mocvd.wafersPerRun);
  const totalPerRun = cost.labor + cost.equipment;
  const totalPerWafer = mocvd.wafersPerRun > 0 ? totalPerRun / mocvd.wafersPerRun : 0;

  const handleAdd = () => {
    addMeasurement({
      id: Date.now().toString(),
      name: '',
      equipmentName: '',
      timePerWaferSec: 60,
      samplingRate: 100,
      equipmentCostPerHour: 10000,
      workers: 1,
      hourlyWage: 18000,
      loadingTimeSec: 300,
      maintenanceCostPerRun: 3000,
    });
  };

  const itemChartData = useMemo(() =>
    measurements.map((m) => {
      const c = calcSingleMeasurementCostPerRun(m, mocvd.wafersPerRun);
      return {
        name: m.name || '(미입력)',
        노무비: Math.round(c.labor),
        장비비: Math.round(c.equipment),
        total: Math.round(c.labor + c.equipment),
      };
    }),
    [measurements, mocvd.wafersPerRun]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 왼쪽: 측정 항목 목록 */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-slate-400">PL, XRD, 두께, 표면 검사 등 측정 항목을 관리합니다.</p>
            <button
              onClick={handleAdd}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700 font-medium"
            >
              + 측정 항목 추가
            </button>
          </div>

          {measurements.map((m, idx) => {
            const itemCost = calcSingleMeasurementCostPerRun(m, mocvd.wafersPerRun);
            const itemTotal = itemCost.labor + itemCost.equipment;
            const itemPerWafer = mocvd.wafersPerRun > 0 ? itemTotal / mocvd.wafersPerRun : 0;

            return (
              <div key={m.id} className="bg-gray-50 dark:bg-slate-800/60 rounded-xl p-5 border border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <input
                    value={m.name}
                    onChange={(e) => updateMeasurement(m.id, { name: e.target.value })}
                    placeholder="측정 항목명"
                    className="bg-white dark:bg-slate-700 dark:text-slate-100 dark:border-slate-500 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium w-36 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                  <input
                    value={m.equipmentName}
                    onChange={(e) => updateMeasurement(m.id, { equipmentName: e.target.value })}
                    placeholder="장비명"
                    className="bg-white dark:bg-slate-700 dark:text-slate-100 dark:border-slate-500 border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                  <div className="ml-auto flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-gray-400 dark:text-slate-400">웨이퍼당</div>
                      <div className="text-sm font-bold text-emerald-700 font-mono">{formatKRW(itemPerWafer)}원</div>
                    </div>
                    <button
                      onClick={() => removeMeasurement(m.id)}
                      className="text-red-400 hover:text-red-600 text-sm border border-red-200 hover:border-red-400 rounded-lg px-2 py-1"
                    >
                      삭제
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {[
                    { label: '시간/매 (초)', key: 'timePerWaferSec' as const },
                    { label: '샘플링률 (%)', key: 'samplingRate' as const },
                    { label: '로딩 시간/런 (초)', key: 'loadingTimeSec' as const },
                    { label: '작업자', key: 'workers' as const },
                    { label: '시급 (원)', key: 'hourlyWage' as const },
                    { label: '장비비/시간 (원)', key: 'equipmentCostPerHour' as const },
                    { label: '유지보수비/런 (원)', key: 'maintenanceCostPerRun' as const },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">{f.label}</label>
                      <input
                        type="number"
                        value={m[f.key]}
                        onChange={(e) => updateMeasurement(m.id, { [f.key]: Number(e.target.value) })}
                        className="bg-white dark:bg-slate-700 dark:text-slate-100 dark:border-slate-500 border border-gray-200 rounded-lg px-2 py-1.5 w-full text-sm text-right focus:outline-none focus:ring-2 focus:ring-emerald-300"
                        min={0}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-600 flex gap-4 text-xs text-gray-500 dark:text-slate-400">
                  <span>런당 노무비: <strong className="text-gray-700">{formatKRW(itemCost.labor)}원</strong></span>
                  <span>런당 장비비: <strong className="text-gray-700">{formatKRW(itemCost.equipment)}원</strong></span>
                  <span>런당 합계: <strong className="text-emerald-700">{formatKRW(itemTotal)}원</strong></span>
                </div>
              </div>
            );
          })}

          {measurements.length === 0 && (
            <div className="text-center py-12 text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-800/40 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-600">
              측정 항목이 없습니다. 위 버튼을 눌러 추가하세요.
            </div>
          )}
        </div>

        {/* 오른쪽: 실시간 차트 */}
        <div className="xl:col-span-1">
          <StickyChartPanel title="실시간 원가 분석" highlight={`${formatKRW(totalPerWafer)} 원/매`}>
            {itemChartData.length > 0 ? (
              <>
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-400 mb-2 font-medium">항목별 런당 원가</p>
                  <ResponsiveContainer width="100%" height={Math.max(120, itemChartData.length * 36)}>
                    <BarChart data={itemChartData} layout="vertical" margin={{ left: 0, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                      <XAxis type="number" tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={56} tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} />
                      <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v: number, name: string) => [`${formatKRW(v)} 원`, name]} />
                      <Bar dataKey="노무비" stackId="a" fill="#3b82f6" />
                      <Bar dataKey="장비비" stackId="a" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-sm bg-blue-500" />
                      <span className="text-xs text-gray-500">노무비</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-sm bg-amber-400" />
                      <span className="text-xs text-gray-500">장비비</span>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100 dark:border-slate-700 space-y-1">
                  {itemChartData.map((d) => (
                    <div key={d.name} className="flex justify-between text-xs">
                      <span className="text-gray-500 dark:text-slate-400">{d.name}</span>
                      <span className="font-mono font-medium text-gray-700 dark:text-slate-200">{formatKRW(d.total)}원</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-xs text-gray-400 dark:text-slate-500 text-center py-8">측정 항목을 추가하면 차트가 표시됩니다.</div>
            )}
            <div className="pt-2 border-t border-gray-100 dark:border-slate-700 text-center">
              <div className="text-xs text-gray-400 dark:text-slate-400">{measurements.length}개 항목 · 런당 합계</div>
              <div className="text-sm font-bold font-mono text-gray-800 dark:text-slate-100">{formatKRW(totalPerRun)}</div>
            </div>
          </StickyChartPanel>
        </div>
      </div>

      <DarkSummary
        items={[
          { label: '노무비 합계', value: cost.labor },
          { label: '장비비 합계', value: cost.equipment },
        ]}
        total={{ label: '웨이퍼당 측정 원가', value: totalPerWafer, accentColor: '#34d399' }}
        label={`런당 원가 분석 (${measurements.length}개 항목)`}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 4. 출하 탭
// ════════════════════════════════════════════════════════════════
function ShipmentTab() {
  const { shipment, mocvd, setShipment } = useCostStore();
  const cost = calcShipmentCostPerRun(shipment, mocvd.wafersPerRun);
  const totalPerRun = cost.labor + cost.material + cost.equipment;
  const totalPerWafer = mocvd.wafersPerRun > 0 ? totalPerRun / mocvd.wafersPerRun : 0;
  const set = (key: keyof ShipmentConfig) => (v: number) => setShipment({ [key]: v });

  const totalTimeSec =
    (shipment.packingTimePerWaferSec + shipment.inspectionTimePerWaferSec) * mocvd.wafersPerRun +
    shipment.documentationTimeSec;

  const costData = useMemo(() => [
    { name: '노무비', value: Math.round(cost.labor), fill: '#3b82f6' },
    { name: '재료비', value: Math.round(cost.material), fill: '#ef4444' },
    { name: '검사장비비', value: Math.round(cost.equipment), fill: '#f59e0b' },
  ], [cost]);

  const matBreakdown = useMemo(() => [
    { name: '포장재', value: shipment.packagingMaterialCost * mocvd.wafersPerRun, fill: '#ef4444' },
    { name: '운송비', value: shipment.shippingCostPerWafer * mocvd.wafersPerRun, fill: '#f97316' },
    { name: '보험비', value: shipment.insuranceCostPerWafer * mocvd.wafersPerRun, fill: '#fbbf24' },
  ].filter(d => d.value > 0), [shipment, mocvd.wafersPerRun]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-5">
          <div className="bg-gray-50 dark:bg-slate-800/60 rounded-xl p-5">
            <GroupHeader title="공정 시간" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <NumField label="포장 시간/매" value={shipment.packingTimePerWaferSec} unit="초" onChange={set('packingTimePerWaferSec')} />
              <NumField label="출하검사 시간/매" value={shipment.inspectionTimePerWaferSec} unit="초" onChange={set('inspectionTimePerWaferSec')} />
              <NumField label="서류 작성 시간/런" value={shipment.documentationTimeSec} unit="초" onChange={set('documentationTimeSec')} />
            </div>
            <div className="mt-3 p-3 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 text-xs text-gray-500 dark:text-slate-300">
              런당 총 처리 시간:{' '}
              <strong className="text-gray-700">
                {Math.floor(totalTimeSec / 3600)}시간 {Math.floor((totalTimeSec % 3600) / 60)}분
              </strong>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-slate-800/60 rounded-xl p-5">
            <GroupHeader title="인건비" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <NumField label="작업자 수" value={shipment.workers} unit="명" onChange={set('workers')} />
              <NumField label="시급" value={shipment.hourlyWage} unit="원" onChange={set('hourlyWage')} />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-slate-800/60 rounded-xl p-5">
            <GroupHeader title="비용 항목" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <NumField label="포장재비/매" value={shipment.packagingMaterialCost} unit="원" onChange={set('packagingMaterialCost')} />
              <NumField label="운송비/매" value={shipment.shippingCostPerWafer} unit="원" onChange={set('shippingCostPerWafer')} />
              <NumField label="보험비/매" value={shipment.insuranceCostPerWafer} unit="원" onChange={set('insuranceCostPerWafer')} />
              <NumField label="검사장비비/시간" value={shipment.inspectionEquipmentCostPerHour} unit="원/h" onChange={set('inspectionEquipmentCostPerHour')} />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-slate-800/60 rounded-xl p-5">
            <GroupHeader title="품질 관리" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <NumField label="출하 불량률" value={shipment.shipmentDefectRate} unit="%" step="0.1" max={100} onChange={set('shipmentDefectRate')} />
            </div>
          </div>
        </div>

        <div className="xl:col-span-1">
          <StickyChartPanel title="실시간 원가 분석" highlight={`${formatKRW(totalPerWafer)} 원/매`}>
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-400 mb-2 font-medium">원가 구성 (런당)</p>
              <CostBarChart data={costData} height={140} />
            </div>
            {matBreakdown.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-400 mb-2 font-medium">재료비 상세</p>
                <ResponsiveContainer width="100%" height={90}>
                  <PieChart>
                    <Pie
                      data={matBreakdown} dataKey="value"
                      cx="50%" cy="50%" innerRadius={22} outerRadius={38}
                      paddingAngle={2}
                    >
                      {matBreakdown.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Pie>
                    <Tooltip
                      {...CHART_TOOLTIP_STYLE}
                      formatter={(v: number, name: string) => [`${formatKRW(v)} 원`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                  {matBreakdown.map((d) => (
                    <div key={d.name} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: d.fill }} />
                      <span className="text-xs text-gray-500 dark:text-slate-400">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-2 border-t border-gray-100 dark:border-slate-700 text-center">
              <div className="text-xs text-gray-400 dark:text-slate-400">런당 합계</div>
              <div className="text-sm font-bold font-mono text-gray-800 dark:text-slate-100">{formatKRW(totalPerRun)}</div>
            </div>
          </StickyChartPanel>
        </div>
      </div>

      <DarkSummary
        items={[
          { label: '런당 노무비', value: cost.labor },
          { label: '런당 재료비', value: cost.material },
          { label: '런당 검사장비비', value: cost.equipment },
        ]}
        total={{ label: '웨이퍼당 출하 원가', value: totalPerWafer, accentColor: '#a78bfa' }}
        label="런당 원가 분석"
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 메인 컴포넌트
// ════════════════════════════════════════════════════════════════
const tabList: { id: Tab; label: string; number: string }[] = [
  { id: 'mocvd', label: 'MOCVD 공정', number: '1' },
  { id: 'bake', label: '베이크 공정', number: '2' },
  { id: 'measurement', label: '측정 공정', number: '3' },
  { id: 'shipment', label: '출하 공정', number: '4' },
];

const tabActiveClass: Record<Tab, string> = {
  mocvd: 'border-blue-600 text-blue-700 bg-blue-50',
  bake: 'border-orange-500 text-orange-700 bg-orange-50',
  measurement: 'border-emerald-600 text-emerald-700 bg-emerald-50',
  shipment: 'border-violet-600 text-violet-700 bg-violet-50',
};

const tabBadgeClass: Record<Tab, string> = {
  mocvd: 'bg-blue-600 text-white',
  bake: 'bg-orange-500 text-white',
  measurement: 'bg-emerald-600 text-white',
  shipment: 'bg-violet-600 text-white',
};

export default function ProcessCost() {
  const [activeTab, setActiveTab] = useState<Tab>('mocvd');

  return (
    <div>
      {/* 공정 비교 개요 차트 (항상 표시) */}
      <ProcessOverviewChart />

      {/* 탭 네비게이션 */}
      <div className="flex gap-1 mb-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm p-1.5 border border-gray-100 dark:border-slate-700">
        {tabList.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                isActive
                  ? `${tabActiveClass[tab.id]} border-current`
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                  isActive ? tabBadgeClass[tab.id] : 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-300'
                }`}
              >
                {tab.number}
              </span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 탭 컨텐츠 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
        {activeTab === 'mocvd' && <MOCVDTab />}
        {activeTab === 'bake' && <BakeTab />}
        {activeTab === 'measurement' && <MeasurementTab />}
        {activeTab === 'shipment' && <ShipmentTab />}
      </div>
    </div>
  );
}
