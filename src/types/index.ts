// EPI 원자재 분류
export type BOMCategory = 'MO소스' | '질소' | '도펀트' | '캐리어' | '기판' | '소모품' | '기타';

export interface BOMItem {
  id: string;
  category: BOMCategory;
  name: string;
  spec: string;
  unit: string;
  usagePerRun: number;
  unitPrice: number;
  supplier: string;
}

// MOCVD 공정
export interface MOCVDConfig {
  wafersPerRun: number;
  runTimeSec: number;
  setupTimeSec: number;
  reactorCount: number;
  equipmentCostPerHour: number;
  maintenanceCostPerRun: number;
  workers: number;
  hourlyWage: number;
  defectRate: number;
}

// 측정 항목
export interface MeasurementItem {
  id: string;
  name: string;
  equipmentName: string;
  timePerWaferSec: number;
  samplingRate: number;
  equipmentCostPerHour: number;
  workers: number;
  hourlyWage: number;
}

// 출하 공정
export interface ShipmentConfig {
  packingTimePerWaferSec: number;
  inspectionTimePerWaferSec: number;
  packagingMaterialCost: number;
  workers: number;
  hourlyWage: number;
  shipmentDefectRate: number;
}

// 제조경비 (EPI 특화)
export interface OverheadCosts {
  electricity: number;
  coolingWater: number;
  cleanroomMaint: number;
  nitrogen: number;
  depreciation: number;
  consumables: number;
  salesExpense: number;
  logisticsCost: number;
  adminCost: number;
}

// 원가 분석 결과
export interface CostBreakdown {
  directMaterial: number;
  directLabor: number;
  manufacturingOverhead: number;
  manufacturingCost: number;
  sellingAdminCost: number;
  totalCost: number;
  unitCost: number;
  costPerRun: number;
}
