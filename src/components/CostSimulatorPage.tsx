import { useCostStore } from '../store/useCostStore';
import CostSummary from './CostSummary';
import BOMTable from './BOMTable';
import ProcessCost from './ProcessCost';
import OverheadCost from './OverheadCost';
import LotSimulation from './LotSimulation';
import BreakEvenAnalysis from './BreakEvenAnalysis';

const tabs = [
  { id: 'summary', label: '원가 요약' },
  { id: 'bom', label: 'EPI 원자재' },
  { id: 'process', label: 'MOCVD / 측정 / 출하' },
  { id: 'overhead', label: '경비/판관비' },
  { id: 'lot', label: '생산량 시뮬레이션' },
  { id: 'bep', label: '손익분기점' },
];

export default function CostSimulatorPage() {
  const { activeTab, setActiveTab } = useCostStore();

  const renderTab = () => {
    switch (activeTab) {
      case 'summary': return <CostSummary />;
      case 'bom': return <BOMTable />;
      case 'process': return <ProcessCost />;
      case 'overhead': return <OverheadCost />;
      case 'lot': return <LotSimulation />;
      case 'bep': return <BreakEvenAnalysis />;
      default: return <CostSummary />;
    }
  };

  return (
    <div>
      <nav className="bg-white rounded-xl shadow-sm border mb-6">
        <div className="flex space-x-1 overflow-x-auto px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
      {renderTab()}
    </div>
  );
}
