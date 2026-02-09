import { useCostStore } from '../store/useCostStore';
import { MOCVDConfig, MeasurementItem, ShipmentConfig } from '../types';
import { formatKRW, calcMOCVDCostPerRun, calcMeasurementCostPerRun, calcShipmentCostPerRun } from '../utils/calculations';

function MOCVDSection() {
  const { mocvd, setMocvd } = useCostStore();
  const cost = calcMOCVDCostPerRun(mocvd);
  const totalPerRun = cost.labor + cost.equipment + cost.maintenance;
  const totalPerWafer = mocvd.wafersPerRun > 0 ? totalPerRun / mocvd.wafersPerRun : 0;

  const fields: { key: keyof MOCVDConfig; label: string; unit: string; step?: string }[] = [
    { key: 'wafersPerRun', label: '1런당 웨이퍼 수', unit: '매' },
    { key: 'runTimeSec', label: '런 시간 (성장)', unit: '초' },
    { key: 'setupTimeSec', label: '셋업 시간 (로딩/퍼지)', unit: '초' },
    { key: 'reactorCount', label: '리액터 수', unit: '대' },
    { key: 'workers', label: '작업자 수', unit: '명' },
    { key: 'hourlyWage', label: '시급', unit: '원' },
    { key: 'equipmentCostPerHour', label: '장비 시간당 비용', unit: '원' },
    { key: 'maintenanceCostPerRun', label: '런당 유지보수비', unit: '원' },
    { key: 'defectRate', label: '불량률', unit: '%', step: '0.1' },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-1">1. MOCVD 공정</h2>
      <p className="text-sm text-gray-500 mb-4">에피택셜 성장 공정 파라미터</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-gray-600 mb-1">{f.label}</label>
            <div className="relative">
              <input
                type="number"
                value={mocvd[f.key]}
                onChange={(e) => setMocvd({ [f.key]: Number(e.target.value) })}
                className="border rounded-md px-3 py-2 w-full text-right pr-10"
                min={0}
                step={f.step || '1'}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{f.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
        <div>
          <div className="text-gray-500">런당 인건비</div>
          <div className="font-bold font-mono">{formatKRW(cost.labor)} 원</div>
        </div>
        <div>
          <div className="text-gray-500">런당 설비비</div>
          <div className="font-bold font-mono">{formatKRW(cost.equipment)} 원</div>
        </div>
        <div>
          <div className="text-gray-500">런당 유지보수</div>
          <div className="font-bold font-mono">{formatKRW(cost.maintenance)} 원</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-2">
          <div className="text-gray-500">웨이퍼당 MOCVD 원가</div>
          <div className="font-bold text-blue-700 font-mono text-lg">{formatKRW(totalPerWafer)} 원</div>
        </div>
      </div>
    </div>
  );
}

function MeasurementSection() {
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
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-lg font-semibold text-gray-800">2. 측정 공정</h2>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
        >
          + 측정 항목 추가
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-4">PL, XRD, 두께, 표면 검사 등</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="px-3 py-2 font-medium text-gray-600">측정항목</th>
              <th className="px-3 py-2 font-medium text-gray-600">장비명</th>
              <th className="px-3 py-2 font-medium text-gray-600 text-right">시간/매 (초)</th>
              <th className="px-3 py-2 font-medium text-gray-600 text-right">샘플링률 (%)</th>
              <th className="px-3 py-2 font-medium text-gray-600 text-right">장비비/시간</th>
              <th className="px-3 py-2 font-medium text-gray-600 text-right">작업자</th>
              <th className="px-3 py-2 font-medium text-gray-600 text-right">시급</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {measurements.map((m) => (
              <tr key={m.id} className="border-t hover:bg-slate-50">
                <td className="px-3 py-2">
                  <input value={m.name} onChange={(e) => updateMeasurement(m.id, { name: e.target.value })} className="border rounded px-2 py-1 w-24" />
                </td>
                <td className="px-3 py-2">
                  <input value={m.equipmentName} onChange={(e) => updateMeasurement(m.id, { equipmentName: e.target.value })} className="border rounded px-2 py-1 w-28" />
                </td>
                <td className="px-3 py-2">
                  <input type="number" value={m.timePerWaferSec} onChange={(e) => updateMeasurement(m.id, { timePerWaferSec: Number(e.target.value) })} className="border rounded px-2 py-1 w-20 text-right" min={0} />
                </td>
                <td className="px-3 py-2">
                  <input type="number" value={m.samplingRate} onChange={(e) => updateMeasurement(m.id, { samplingRate: Number(e.target.value) })} className="border rounded px-2 py-1 w-20 text-right" min={0} max={100} />
                </td>
                <td className="px-3 py-2">
                  <input type="number" value={m.equipmentCostPerHour} onChange={(e) => updateMeasurement(m.id, { equipmentCostPerHour: Number(e.target.value) })} className="border rounded px-2 py-1 w-24 text-right" min={0} />
                </td>
                <td className="px-3 py-2">
                  <input type="number" value={m.workers} onChange={(e) => updateMeasurement(m.id, { workers: Number(e.target.value) })} className="border rounded px-2 py-1 w-14 text-right" min={1} />
                </td>
                <td className="px-3 py-2">
                  <input type="number" value={m.hourlyWage} onChange={(e) => updateMeasurement(m.id, { hourlyWage: Number(e.target.value) })} className="border rounded px-2 py-1 w-24 text-right" min={0} />
                </td>
                <td className="px-3 py-2">
                  <button onClick={() => removeMeasurement(m.id)} className="text-red-500 hover:text-red-700 text-sm">삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 bg-slate-50 rounded-lg p-4 flex justify-between items-center">
        <span className="text-sm text-gray-600">측정 공정 원가 (런당 / 웨이퍼당)</span>
        <div className="text-right">
          <span className="font-bold font-mono">{formatKRW(totalPerRun)} 원</span>
          <span className="text-gray-400 mx-2">/</span>
          <span className="font-bold text-blue-700 font-mono">{formatKRW(totalPerWafer)} 원</span>
        </div>
      </div>
    </div>
  );
}

function ShipmentSection() {
  const { shipment, mocvd, setShipment } = useCostStore();
  const cost = calcShipmentCostPerRun(shipment, mocvd.wafersPerRun);
  const totalPerRun = cost.labor + cost.material;
  const totalPerWafer = mocvd.wafersPerRun > 0 ? totalPerRun / mocvd.wafersPerRun : 0;

  const fields: { key: keyof ShipmentConfig; label: string; unit: string; step?: string }[] = [
    { key: 'packingTimePerWaferSec', label: '포장 시간/매', unit: '초' },
    { key: 'inspectionTimePerWaferSec', label: '출하검사 시간/매', unit: '초' },
    { key: 'packagingMaterialCost', label: '포장재비/매', unit: '원' },
    { key: 'workers', label: '작업자 수', unit: '명' },
    { key: 'hourlyWage', label: '시급', unit: '원' },
    { key: 'shipmentDefectRate', label: '출하 불량률', unit: '%', step: '0.1' },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-1">3. 출하 공정</h2>
      <p className="text-sm text-gray-500 mb-4">포장, 출하 검사, 선적</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-gray-600 mb-1">{f.label}</label>
            <div className="relative">
              <input
                type="number"
                value={shipment[f.key]}
                onChange={(e) => setShipment({ [f.key]: Number(e.target.value) })}
                className="border rounded-md px-3 py-2 w-full text-right pr-10"
                min={0}
                step={f.step || '1'}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{f.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 rounded-lg p-4 flex justify-between items-center">
        <span className="text-sm text-gray-600">출하 공정 원가 (런당 / 웨이퍼당)</span>
        <div className="text-right">
          <span className="font-bold font-mono">{formatKRW(totalPerRun)} 원</span>
          <span className="text-gray-400 mx-2">/</span>
          <span className="font-bold text-blue-700 font-mono">{formatKRW(totalPerWafer)} 원</span>
        </div>
      </div>
    </div>
  );
}

export default function ProcessCost() {
  return (
    <div className="space-y-6">
      <MOCVDSection />
      <MeasurementSection />
      <ShipmentSection />
    </div>
  );
}
