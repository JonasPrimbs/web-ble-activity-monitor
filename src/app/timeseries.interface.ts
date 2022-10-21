import { Record } from './record.interface';

export interface Timeseries {
  name: string;
  values: Record[];
}