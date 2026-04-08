export type Frequency = 'QID' | 'TID' | 'BID' | 'daily' | 'QOD';
export type PillSize = 0.5 | 1 | 1.5 | 2 | 4;

export interface TaperStep {
  dose: number;       // mg per dose
  frequency: Frequency;
  days: number;       // duration of this step
}

export interface TaperSchedule {
  patientName: string;
  startDate: string;  // ISO date string
  indication: string;
  providerName: string;
  providerPhone: string;
  pillSize: PillSize;
  steps: TaperStep[];
}

export interface DoseTime {
  time: 'Morning' | 'Noon' | 'Evening' | 'Bedtime';
  mg: number;
  pills: number;
  pillLabel: string;  // e.g., "2 tablets" or "1 tablet"
}

export interface DailyDose {
  date: Date;
  dayNumber: number;
  totalDailyMg: number;
  totalPills: number;
  instructions: string;
  doses: DoseTime[];
}

export interface TaperTemplate {
  id: string;
  name: string;
  description: string;
  indication: string;
  steps: TaperStep[];
}
