import { useCostStore } from './store/useCostStore';
import Layout from './components/Layout';
import CostSummary from './components/CostSummary';
import BOMTable from './components/BOMTable';
import ProcessCost from './components/ProcessCost';
import OverheadCost from './components/OverheadCost';
import LotSimulation from './components/LotSimulation';
import BreakEvenAnalysis from './components/BreakEvenAnalysis';

function App() {
  const activeTab = useCostStore((s) => s.activeTab);

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
    <Layout>
      {renderTab()}
    </Layout>
  );
}

export default App;
