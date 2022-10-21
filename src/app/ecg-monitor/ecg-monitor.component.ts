import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ECG_INTERVAL_CHARACTERISTIC_UUID, ECG_VOLTAGE_CHARACTERISTIC_UUID, SNACKBAR_DURATION_DEFAULT, SNACKBAR_DURATION_ERROR } from '../config';
import { Timeseries } from '../timeseries.interface';

export const READ_INTERVAL_VALUE_FAILED = 'Failed to read interval value';

@Component({
  selector: 'app-ecg-monitor',
  templateUrl: './ecg-monitor.component.html',
  styleUrls: ['./ecg-monitor.component.scss'],
})
export class EcgMonitorComponent implements OnInit, OnDestroy {

  @Input('activityService')
  activityService?: BluetoothRemoteGATTService;

  ecgDataCharacteristic?: BluetoothRemoteGATTCharacteristic;
  ecgIntervalCharacteristic?: BluetoothRemoteGATTCharacteristic;

  ecgInterval?: number;

  isRecording: boolean = false;

  readonly recording: { t: number, v: number }[] = [];

  get recordingString(): string {
    const header = 't\tv';
    const rows = this.recording.map(r => `${r.t}\t${r.v}`);
    const data = rows.join('\n');
    return `${header}\n${data}`;
  }

  readonly ecgData: Timeseries = {
    name: 'ECG',
    values: [],
  };

  get recordingDuration(): number {
    if (this.recording.length === 0) {
      return 0;
    }

    const start = this.recording[0].t;
    const end = this.recording[this.recording.length - 1].t;
    return end - start;
  }

  constructor(
    private readonly snackBarService: MatSnackBar,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.connectAndUpdateIntervalCharacteristic();
  }

  async ngOnDestroy(): Promise<void> {
    await this.stopStreaming();
    this.disconnectIntervalCharacteristic();
  }

  private async getIntervalCharacteristic(): Promise<BluetoothRemoteGATTCharacteristic> {
    if (this.activityService === undefined) {
      throw 'Device not connected';
    }

    try {
      return await this.activityService.getCharacteristic(ECG_INTERVAL_CHARACTERISTIC_UUID);
    } catch (error) {
      console.error(`[ERROR] Failed to connect to ECG Interval characteristic:`, error);
      throw 'Connection error';
    }
  }
  private async connectAndUpdateIntervalCharacteristic(): Promise<void> {
    try {
      this.ecgIntervalCharacteristic = await this.getIntervalCharacteristic();
      this.ecgInterval = await this.getInterval();
    } catch (error) {
      this.ecgIntervalCharacteristic = undefined;
      this.ecgInterval = undefined;
      this.snackBarService.open(`Failed to connect ECG: ${error}`, 'OK', { duration: SNACKBAR_DURATION_ERROR });
    }
  }
  private disconnectIntervalCharacteristic(): void {
    this.ecgIntervalCharacteristic = undefined;
    this.ecgInterval = undefined;
  }

  private async getInterval(): Promise<number> {
    try {
      // Read value from characteristic.
      const dataView = await this.ecgIntervalCharacteristic?.readValue();

      // Verify that value was found.
      if (!dataView) {
        throw 'Value not found';
      }
      
      // Verify that length is enough to read 16 bit (= 2 byte) unsigned integer.
      if (dataView.byteLength < 2) {
        throw `Invalid length of ${dataView.byteLength} bytes, expected 2 bytes`;
      }

      // Parse the value.
      const value = dataView.getUint16(0, true);

      console.log('[INFO] ECG interval found:', value, dataView);

      return value;
    } catch (error) {
      console.error('[ERROR] Failed to read ECG interval value:', error);
      throw READ_INTERVAL_VALUE_FAILED;
    }
  }
  private async setInterval(interval: number): Promise<void> {
    try {
      // Convert interval to data view.
      var dataView: DataView;
      try {
        const buffer = new ArrayBuffer(2);
        dataView = new DataView(buffer);
        dataView.setUint16(0, interval, true);
      } catch (error) {
        console.error(`[ERROR] Failed to set ECG interval: Failed to convert "${interval}" to 16-bit unsigned integer`, error);
        throw 'Conversion error';
      }

      // Write value to characteristic.
      try {
        await this.ecgIntervalCharacteristic?.writeValue(dataView);
      } catch (error) {
        console.error(`[ERROR] Failed to set ECG interval: Failed to write interval to characteristic`, error);
        throw 'Characteristic write error';
      }

      // Set local ECG value.
      this.ecgInterval = interval;

      console.log('[INFO] ECG interval set:', interval, dataView);
    } catch (error) {
      console.error('[ERROR] Failed to read ECG interval value:', error);
      throw READ_INTERVAL_VALUE_FAILED;
    }
  }

  async onIntervalChange(event: MatSelectChange): Promise<void> {
    try {
      let value: number;
      try {
        value = Number(event.value);
      } catch (error) {
        console.error(`[ERROR] Failed to convert ECG interval input value "${event.value}" to number`);
        throw 'Input parsing error';
      }

      await this.setInterval(value);
    } catch (error) {
      this.snackBarService.open(`Changing ECG interval failed: ${error}`, 'OK', { duration: SNACKBAR_DURATION_ERROR });
    }
  }

  private readonly onEcgDataChanged = (e: Event) => {
    const characteristic = e.target as BluetoothRemoteGATTCharacteristic;
    const dataView = characteristic.value;
    if (dataView === undefined) {
      return;
    }

    if (this.ecgInterval === undefined) {
      console.warn(`[WARNING] ECG data received but interval is unknown`);
      return;
    }

    if (dataView.byteLength <= 4) {
      console.error(`Invalid ECG frame: Length of ${dataView.byteLength}`, dataView);
      return;
    }

    const time = dataView.getUint32(0, true);

    const voltages = [];
    const dataViewLength = dataView.byteLength;
    for (let i = 4; i < dataViewLength; i += 2) {
      const voltage = dataView.getInt16(i, true);
      voltages.push(voltage);
    }

    const ecgPacket = {
      t: time,
      v: voltages,
    };

    const n = voltages.length;
    const ecgVoltages = [];
    for (let i = 0; i < n; i++) {
      const y = voltages[i];
      const x = time - (n - i - 1) * this.ecgInterval;
      const value = { x, y };
      this.ecgData.values.push(value);
      if (this.isRecording) {
        this.recording.push({ t: x, v: y });
      }
      ecgVoltages.push(value);
    }
  };

  async startStreaming(): Promise<void> {
    try {
      if (this.activityService === undefined) {
        throw 'Device not connected';
      }

      try {
        this.ecgDataCharacteristic = await this.activityService.getCharacteristic(ECG_VOLTAGE_CHARACTERISTIC_UUID);
        this.ecgDataCharacteristic.addEventListener('characteristicvaluechanged', this.onEcgDataChanged);
        await this.ecgDataCharacteristic.startNotifications();
        this.snackBarService.open('ECG started', 'OK', { duration: SNACKBAR_DURATION_DEFAULT });
      } catch (error) {
        console.error(`[ERROR] Failed to connect to ECG Data characteristic:`, error);
        throw 'Connection error';
      }
    } catch (error) {
      await this.stopStreaming();
      this.snackBarService.open(`Failed to start ECG: ${error}`, 'OK', { duration: SNACKBAR_DURATION_ERROR });
    }
  }
  async stopStreaming(): Promise<void> {
    if (!this.ecgDataCharacteristic) {
      return;
    }

    this.ecgDataCharacteristic.removeEventListener('characteristicvaluechanged', this.onEcgDataChanged);
    await this.ecgDataCharacteristic.stopNotifications();
    this.ecgDataCharacteristic = undefined;

    this.snackBarService.open('ECG stopped', 'OK', { duration: SNACKBAR_DURATION_DEFAULT });
  }

  startRecording(): void {
    // Clear last recording.
    this.recording.length = 0;

    // Enable recording.
    this.isRecording = true;
  }
  stopRecording(): void {
    // Disable recording.
    this.isRecording = false;
  }

  copyToClipboard(): void {
    this.snackBarService.open('Copied to clipboard', 'OK', { duration: SNACKBAR_DURATION_DEFAULT });
  }
  download(): void {
    const data = new Blob([this.recordingString], { type: 'text/tsv' });
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ecg.tsv';
    link.click();
  }
}
