import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useCostStore } from '../store/useCostStore';
import { calcBreakEven, calcMaterialPerRun, calcMOCVDCostPerRun, calcMeasurementCostPerRun, calcShipmentCostPerRun, calcFixedOverhead, calcSellingAdminCost, formatKRW } from '../utils/calculations';

export default function BreakEvenAnalysis() {
  const { bom, mocvd, measurements, shipment, overhead, sellingPrice, setSellingPrice } = useCostStore();

  const bep = useMemo(
    () => calcBreakEven(bom, mocvd, measurements, shipment, overhead, sellingPrice),
    [bom, mocvd, measurements, shipment, overhead, sellingPrice]
  );

  // 변동비 (웨이퍼당)
  const variableCostPerWafer = useMemo(() => {
    const totalYield = (1 - mocvd.defectRate / 100) * (1 - shipment.shipmentDefectRate / 100);
    const materialPerRun = calcMaterialPerRun(bom);
    const mocvdCost = calcMOCVDCostPerRun(mocvd);
    const measCost = calcMeasurementCostPerRun(measurements, mocvd.wafersPerRun);
    const shipCost = calcShipmentCostPerRun(shipment, mocvd.wafersPerRun);
    const costPerRun = materialPerRun + mocvdCost.labor + mocvdCost.equipment + mocvdCost.maintenance + measCost.labor + measCost.equipment + shipCost.labor + shipCost.material;
    const goodPerRun = mocvd.wafersPerRun * totalYield;
    return goodPerRun > 0 ? costPerRun / goodPerRun : 0;
  }, [bom, mocvd, measurements, shipment]);

  const fixedCost = calcFixedOverhead(overhead) + calcSellingAdminCost(overhead);

  const chartData = useMemo(() => {
    const maxQty = bep ? Math.max(bep.bepQuantity * 2, 500) : 3000;
    const step = Math.max(Math.floor(maxQty / 20), 1);
    const points = [];
    for (let q = 0; q <= maxQty; q += step) {
      points.push({
        quantity: q,
        revenue: q * sellingPrice,
        totalCost: fixedCost + q * variableCostPerWafer,
        fixedCostLine: fixedCost,
      });
    }
    return points;
  }, [sellingPrice, fixedCost, variableCostPerWafer, bep]);

  const margin = sellingPrice - variableCostPerWafer;
  const marginRate = sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">손익분기점 (BEP) 분석</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">웨이퍼 판매 단가 (원/매)</label>
            <input
              type="number"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(Number(e.target.value))}
              className="border rounded-md px-3 py-2 w-full text-right text-lg"
              min={0}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-500">변동비/매</div>
              <div className="font-bold font-mono">{formatKRW(variableCostPerWafer)} 원</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-500">고정비 합계 (월)</div>
              <div className="font-bold font-mono">{formatKRW(fixedCost)} 원</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className={`rounded-lg p-4 text-center ${bep ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="text-xs text-gray-500">BEP 수량</div>
            <div className={`text-xl font-bold font-mono ${bep ? 'text-green-700' : 'text-red-700'}`}>
              {bep ? `${bep.bepQuantity.toLocaleString()}매` : '달성 불가'}
            </div>
          </div>
          <div className={`rounded-lg p-4 text-center ${bep ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="text-xs text-gray-500">BEP 매출액</div>
            <div className={`text-xl font-bold font-mono ${bep ? 'text-green-700' : 'text-red-700'}`}>
              {bep ? `${formatKRW(bep.bepRevenue)} 원` : '-'}
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500">매당 마진</div>
            <div className={`text-xl font-bold font-mono ${margin >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
              {formatKRW(margin)} 원
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500">마진율</div>
            <div className={`text-xl font-bold ${marginRate >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
              {marginRate.toFixed(1)}%
            </div>
          </div>
        </div>

        {margin <= 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm font-medium">
              판매 단가가 변동비보다 낮아 손익분기점 달성이 불가능합니다.
              최소 판매 단가: {formatKRW(variableCostPerWafer + 1)} 원 이상으로 설정하세요.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-md font-semibold text-gray-700 mb-4">손익분기점 차트</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="quantity"
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
              label={{ value: '웨이퍼 수 (매)', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              tickFormatter={(v) => {
                if (v >= 1000000000) return `${(v / 1000000000).toFixed(0)}B`;
                if (v >= 1000000) return `${(v / 1000000).toFixed(0)}M`;
                if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
                return v;
              }}
              label={{ value: '금액 (원)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                `${formatKRW(value)} 원`,
                name === 'revenue' ? '매출액' : name === 'totalCost' ? '총비용' : '고정비',
              ]}
              labelFormatter={(label) => `수량: ${Number(label).toLocaleString()}매`}
            />
            <Legend
              formatter={(value) =>
                value === 'revenue' ? '매출액' : value === 'totalCost' ? '총비용' : '고정비'
              }
            />
            <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} dot={false} name="revenue" />
            <Line type="monotone" dataKey="totalCost" stroke="#dc2626" strokeWidth={2} dot={false} name="totalCost" />
            <Line type="monotone" dataKey="fixedCostLine" stroke="#9ca3af" strokeWidth={1} strokeDasharray="5 5" dot={false} name="fixedCostLine" />
            {bep && (
              <ReferenceLine
                x={bep.bepQuantity}
                stroke="#2563eb"
                strokeDasharray="3 3"
                label={{ value: `BEP: ${bep.bepQuantity.toLocaleString()}매`, position: 'top', fill: '#2563eb' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
