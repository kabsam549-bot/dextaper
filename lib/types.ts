export type Frequency = 'QID' | 'TID' | 'BID' | 'daily' | 'QOD';

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
  steps: TaperStep[];
}

export interface DoseTime {
  time: string;  // e.g., "Morning", "Noon", "Evening", "Bedtime"
  mg: number;
}

export interface DailyDose {
  date: Date;
  dayNumber: number;
  totalDailyMg: number;
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
