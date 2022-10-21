import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ACTIVITY_SERVICE_UUID, BATTERY_SERVICE_UUID, SNACKBAR_DURATION_DEFAULT, SNACKBAR_DURATION_ERROR } from '../config';
import { Sensor } from '../sensor/sensor.class';
import { SensorService } from '../sensor/sensor.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {

  /**
   * The connected sensor or undefined if not connected.
   */
  sensor?: Sensor;

  /**
   * The connected Activity GATT service or undefined if not connected.
   */
  activityService?: BluetoothRemoteGATTService;

  /**
   * Constructs a new App Component instance.
   * @param sensorService Sensor Service instance.
   * @param snackBarService Material Snackbar Service instance.
   */
  constructor(
    private readonly sensorService: SensorService,
    private readonly snackBarService: MatSnackBar,
  ) {}

  /**
   * Connects a sensor.
   */
  async connectSensor(): Promise<void> {
    try {
      // Connect Bluetooth sensor.
      this.sensor = await this.sensorService.connectSensor();
      // Connect GATT services.
      await this.sensor.connectServices({
        required: [
          ACTIVITY_SERVICE_UUID,
        ],
        optional: [
          BATTERY_SERVICE_UUID,
        ],
      });
      // Store activity service.
      this.activityService = this.sensor.services[ACTIVITY_SERVICE_UUID];
      console.log(this.sensor);
      console.log(this.activityService);

      this.snackBarService.open(`Connected to sensor "${this.sensor?.name ?? 'unknown sensor'}"`, 'OK', { duration: SNACKBAR_DURATION_DEFAULT });
    } catch (error) {
      // Disconnect sensor if connected.
      await this.sensor?.disconnect();
      // Remove activity service.
      this.activityService = undefined;
      // Remove sensor.
      this.sensor = undefined;

      this.snackBarService.open(`Connection failed: ${error}`, 'OK', { duration: SNACKBAR_DURATION_ERROR });
    }
  }

  /**
   * Disconnects the current sensor.
   */
  async disconnectSensor(): Promise<void> {
    if (this.sensor) {
      const sensorName = this.sensor.name ?? 'unknown sensor';
      await this.sensor.disconnect();
      this.sensor = undefined;
      this.snackBarService.open(`Disconnected from sensor "${sensorName}"`, 'OK', { duration: SNACKBAR_DURATION_DEFAULT });
    } else {
      this.snackBarService.open(`Sensor already disconnected`, 'OK', { duration: SNACKBAR_DURATION_ERROR });
    }
  }
}
