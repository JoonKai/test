import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
} from 'recharts';
import { useCostStore } from '../store/useCostStore';
import {
  calcFullCost, calcMaterialPerRun, calcMOCVDCostPerRun, calcBakeCostPerRun,
  calcMeasurementCostPerRun, calcShipmentCostPerRun,
  calcFixedOverhead, calcSellingAdminCost, formatKRW,
} from '../utils/calculations';

const PIE_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444'];

const TOOLTIP_STYLE = {
  contentStyle: { borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' },
};

export default function CostSummary() {
  const { bom, mocvd, bake, measurements, shipment, overhead, lotSize, sellingPrice } = useCostStore();

  const cost = useMemo(
    () => calcFullCost(bom, mocvd, bake, measurements, shipment, overhead, lotSize),
    [bom, mocvd, bake, measurements, shipment, overhead, lotSize]
  );

  const { runCount, scaleFactor } = useMemo(() => {
    const totalYield = (1 - mocvd.defectRate / 100) * (1 - shipment.shipmentDefectRate / 100);
    const required = totalYield > 0 ? lotSize / totalYield : lotSize;
    const rc = mocvd.wafersPerRun > 0 ? Math.ceil(required / mocvd.wafersPerRun) : 0;
    return { runCount: rc, scaleFactor: lotSize > 0 ? rc / lotSize : 0 };
  }, [lotSize, mocvd, shipment]);

  const profit = sellingPrice - cost.unitCost;
  const profitRate = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

  // ── 원가 구성비 파이 차트 데이터 ──────────────────────────────
  const pieData = useMemo(() => [
    { name: '직접재료비', value: cost.directMaterial },
    { name: '직접노무비', value: cost.directLabor },
    { name: '제조경비', value: cost.manufacturingOverhead },
    { name: '판관비', value: cost.sellingAdminCost },
  ].filter((d) => d.value > 0), [cost]);

  // ── 공정별 웨이퍼당 원가 바 차트 데이터 ────────────────────────
  const stageData = useMemo(() => {
    const wpr = mocvd.wafersPerRun;
    const mocvdC = calcMOCVDCostPerRun(mocvd);
    const bakeC = calcBakeCostPerRun(bake, wpr);
    const measC = calcMeasurementCostPerRun(measurements, wpr);
    const shipC = calcShipmentCostPerRun(shipment, wpr);

    // 재료비는 런당이므로 scaleFactor 곱, 고정비/판관비는 lotSize로 나눔
    const matPerWafer = Math.round(calcMaterialPerRun(bom) * scaleFactor);
    const mocvdPerWafer = Math.round((mocvdC.labor + mocvdC.equipment + mocvdC.maintenance + mocvdC.cleaning + mocvdC.power) * scaleFactor);
    const bakePerWafer = Math.round((bakeC.labor + bakeC.equipment + bakeC.maintenance) * scaleFactor);
    const measPerWafer = Math.round((measC.labor + measC.equipment) * scaleFactor);
    const shipPerWafer = Math.round((shipC.labor + shipC.material + shipC.equipment) * scaleFactor);
    const overheadPerWafer = lotSize > 0 ? Math.round(calcFixedOverhead(overhead) / lotSize) : 0;
    const saPerWafer = lotSize > 0 ? Math.round(calcSellingAdminCost(overhead) / lotSize) : 0;

    return [
      { name: '원자재', value: matPerWafer, fill: '#1d4ed8', pct: 0 },
      { name: 'MOCVD', value: mocvdPerWafer, fill: '#3b82f6', pct: 0 },
      { name: '베이크', value: bakePerWafer, fill: '#f97316', pct: 0 },
      { name: '측정', value: measPerWafer, fill: '#10b981', pct: 0 },
      { name: '출하', value: shipPerWafer, fill: '#8b5cf6', pct: 0 },
      { name: '고정경비', value: overheadPerWafer, fill: '#f59e0b', pct: 0 },
      { name: '판관비', value: saPerWafer, fill: '#ef4444', pct: 0 },
    ].map((d) => ({
      ...d,
      pct: cost.unitCost > 0 ? (d.value / cost.unitCost) * 100 : 0,
    }));
  }, [bom, mocvd, bake, measurements, shipment, overhead, lotSize, scaleFactor, cost.unitCost]);

  // ── 매출 vs 원가 누적 바 (웨이퍼당) ───────────────────────────
  const waterfallData = useMemo(() => {
    let cumulative = 0;
    return stageData.map((d) => {
      const start = cumulative;
      cumulative += d.value;
      return { ...d, start, end: cumulative };
    });
  }, [stageData]);

  const summaryItems = [
    { label: '직접재료비 (MO소스/가스/기판)', value: cost.directMaterial, color: 'text-blue-700' },
    { label: '직접노무비 (MOCVD/베이크/측정/출하)', value: cost.directLabor, color: 'text-green-700' },
    { label: '제조경비 (설비/유지보수/간접)', value: cost.manufacturingOverhead, color: 'text-amber-700' },
    { label: '제조원가', value: cost.manufacturingCost, color: 'text-gray-800', bold: true },
    { label: '판관비', value: cost.sellingAdminCost, color: 'text-red-600' },
    { label: '총원가', value: cost.totalCost, color: 'text-gray-900', bold: true, border: true },
  ];

  return (
    <div className="space-y-6">
      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
          <div className="text-xs text-gray-500 mb-1">목표 웨이퍼</div>
          <div className="text-2xl font-bold text-gray-800">{lotSize.toLocaleString()}<span className="text-sm font-normal">매</span></div>
          <div className="text-xs text-gray-400">{runCount}런 필요</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
          <div className="text-xs text-gray-500 mb-1">웨이퍼당 원가</div>
          <div className="text-2xl font-bold text-blue-700 font-mono">{formatKRW(cost.unitCost)}<span className="text-sm font-normal"> 원</span></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
          <div className="text-xs text-gray-500 mb-1">런당 원가</div>
          <div className="text-2xl font-bold text-indigo-700 font-mono">{formatKRW(cost.costPerRun)}<span className="text-sm font-normal"> 원</span></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
          <div className="text-xs text-gray-500 mb-1">판매 단가</div>
          <div className="text-2xl font-bold text-gray-800 font-mono">{formatKRW(sellingPrice)}<span className="text-sm font-normal"> 원</span></div>
        </div>
        <div className={`rounded-xl shadow-sm border p-5 text-center ${profit >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
          <div className="text-xs text-gray-500 mb-1">매당 이익 (이익률)</div>
          <div className={`text-2xl font-bold font-mono ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {formatKRW(profit)}<span className="text-sm font-normal"> 원 ({profitRate.toFixed(1)}%)</span>
          </div>
        </div>
      </div>

      {/* 원가 명세 + 파이 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">원가 명세 ({lotSize.toLocaleString()}매 기준)</h3>
          <div className="space-y-3">
            {summaryItems.map((item) => (
              <div
                key={item.label}
                className={`flex justify-between items-center py-2 ${item.border ? 'border-t-2 pt-3' : ''}`}
              >
                <span className={`text-sm ${item.bold ? 'font-semibold' : ''} text-gray-600`}>{item.label}</span>
                <div className="text-right">
                  <span className={`font-mono ${item.bold ? 'font-bold text-lg' : ''} ${item.color}`}>
                    {formatKRW(item.value)} 원
                  </span>
                  <span className="text-xs text-gray-400 block">
                    (매당 {formatKRW(lotSize > 0 ? item.value / lotSize : 0)} 원)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">원가 구성비</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%" cy="50%"
                innerRadius={60} outerRadius={110}
                paddingAngle={2} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
              >
                {pieData.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...TOOLTIP_STYLE} formatter={(value: number) => `${formatKRW(value)} 원`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 단계별 웨이퍼당 원가 바 차트 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700">공정 단계별 웨이퍼당 원가 구조</h3>
            <p className="text-xs text-gray-400 mt-0.5">각 단계가 웨이퍼 1매 원가에 기여하는 비용</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">총 원가/매</div>
            <div className="text-lg font-bold text-gray-800 font-mono">{formatKRW(cost.unitCost)} 원</div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={stageData} margin={{ top: 10, right: 60, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
              tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
            />
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(v: number, _: string, props: { payload?: { pct?: number } }) => [
                `${formatKRW(v)} 원 (${(props.payload?.pct ?? 0).toFixed(1)}%)`,
                '웨이퍼당 원가',
              ]}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {stageData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              <LabelList
                dataKey="value"
                position="top"
                formatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v}
                style={{ fontSize: 10, fill: '#6b7280' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* 범례 및 누적 바 */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1 h-5 rounded-lg overflow-hidden">
            {waterfallData.map((d) =>
              d.value > 0 ? (
                <div
                  key={d.name}
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${(d.value / cost.unitCost) * 100}%`,
                    backgroundColor: d.fill,
                    minWidth: '2px',
                  }}
                  title={`${d.name}: ${formatKRW(d.value)}원 (${d.pct.toFixed(1)}%)`}
                />
              ) : null
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {stageData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.fill }} />
                <span>{d.name}</span>
                <span className="font-mono font-medium text-gray-800">{formatKRW(d.value)}원</span>
                <span className="text-gray-400">({d.pct.toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 이익 게이지 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">수익성 분석</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>원가</span>
              <span>{formatKRW(cost.unitCost)} 원</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: sellingPrice > 0 ? `${Math.min((cost.unitCost / sellingPrice) * 100, 100)}%` : '0%' }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>판매가 대비 원가 비율</span>
              <span className="font-medium">
                {sellingPrice > 0 ? ((cost.unitCost / sellingPrice) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-xs text-gray-500 mb-2">매당 이익</div>
            <div className={`text-3xl font-bold font-mono ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profit >= 0 ? '+' : ''}{formatKRW(profit)}
              <span className="text-base font-normal"> 원</span>
            </div>
            <div className={`text-sm mt-1 font-medium ${profitRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              이익률 {profitRate.toFixed(1)}%
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>이익</span>
              <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>{formatKRW(Math.abs(profit))} 원</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${profit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: sellingPrice > 0 ? `${Math.min(Math.abs(profitRate), 100)}%` : '0%' }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>총 이익 ({lotSize.toLocaleString()}매)</span>
              <span className={`font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatKRW(profit * lotSize)} 원
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
