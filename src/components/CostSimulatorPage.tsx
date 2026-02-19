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
  { id: 'process', label: 'MOCVD / 베이크 / 측정 / 출하' },
  { id: 'overhead', label: '경비/판관비' },
  { id: 'lot', label: '생산량 시뮬레이션' },
  { id: 'bep', label: '손익분기점' },
];

export default function CostSimulatorPage() {
  const { activeTab, setActiveTab } = useCostStore();

  const renderTab = () => {
    switch (activeTab) {
      case 'summary':
        return <CostSummary />;
      case 'bom':
        return <BOMTable />;
      case 'process':
        return <ProcessCost />;
      case 'overhead':
        return <OverheadCost />;
      case 'lot':
        return <LotSimulation />;
      case 'bep':
        return <BreakEvenAnalysis />;
      default:
        return <CostSummary />;
    }
  };

  return (
    <div>
      <nav className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-700/50 mb-6">
        <div className="flex space-x-1 overflow-x-auto px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-500 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:border-gray-300 dark:hover:border-slate-500'
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
