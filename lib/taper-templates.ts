import type { TaperTemplate } from './types';

export const templates: TaperTemplate[] = [
  {
    id: 'brain-mets-standard',
    name: 'Brain Mets - Standard',
    description: '16 mg/day start, 2-week taper',
    indication: 'Brain metastases',
    steps: [
      { dose: 4, frequency: 'QID', days: 3 },
      { dose: 4, frequency: 'BID', days: 3 },
      { dose: 2, frequency: 'BID', days: 3 },
      { dose: 2, frequency: 'daily', days: 3 },
      { dose: 1, frequency: 'daily', days: 3 },
    ],
  },
  {
    id: 'brain-mets-rapid',
    name: 'Brain Mets - Rapid',
    description: '8 mg/day start, ~9-day taper',
    indication: 'Brain metastases',
    steps: [
      { dose: 4, frequency: 'BID', days: 3 },
      { dose: 2, frequency: 'BID', days: 3 },
      { dose: 2, frequency: 'daily', days: 3 },
    ],
  },
  {
    id: 'hgg-during-rt',
    name: 'High-Grade Glioma - During RT',
    description: '16 mg/day start, taper over RT course',
    indication: 'High-grade glioma',
    steps: [
      { dose: 8, frequency: 'BID', days: 4 },
      { dose: 4, frequency: 'BID', days: 4 },
      { dose: 2, frequency: 'BID', days: 14 },
      { dose: 2, frequency: 'daily', days: 5 },
      { dose: 1, frequency: 'daily', days: 5 },
    ],
  },
  {
    id: 'post-op-mild',
    name: 'Post-Op / Mild Symptoms',
    description: '4 mg/day start, gentle taper',
    indication: 'Post-operative',
    steps: [
      { dose: 2, frequency: 'BID', days: 5 },
      { dose: 2, frequency: 'daily', days: 5 },
      { dose: 1, frequency: 'daily', days: 5 },
    ],
  },
  {
    id: 'spine-mets',
    name: 'Spine Mets - Standard',
    description: '8 mg/day start, 2-week taper',
    indication: 'Spine metastases',
    steps: [
      { dose: 4, frequency: 'BID', days: 4 },
      { dose: 2, frequency: 'BID', days: 4 },
      { dose: 2, frequency: 'daily', days: 3 },
      { dose: 1, frequency: 'daily', days: 3 },
    ],
  },
];

export const indications = [
  'Brain metastases',
  'High-grade glioma',
  'Meningioma',
  'Spine metastases',
  'Post-operative',
  'Other',
];

export const frequencies = [
  { value: 'QID' as const, label: 'Four times daily (QID)' },
  { value: 'TID' as const, label: 'Three times daily (TID)' },
  { value: 'BID' as const, label: 'Twice daily (BID)' },
  { value: 'daily' as const, label: 'Once daily' },
  { value: 'QOD' as const, label: 'Every other day (QOD)' },
];
