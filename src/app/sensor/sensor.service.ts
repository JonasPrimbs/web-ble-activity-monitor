import { Injectable } from '@angular/core';

import { SensorOptions } from './sensor-options.class';
import { Sensor } from './sensor.class';

export const ERR_DEVICE_DISCOVERY_FAILED = 'Device discovery failed';
export const ERR_SERVER_CONNECTION_FAILED = 'GATT server connection failed';
export const ERR_BLUETOOTH_NOT_SUPPORTED = 'Bluetooth API is not supported';

@Injectable({
  providedIn: 'root',
})
export class SensorService {

  /**
   * Default options to request bluetooth sensor devices.
   */
  private get defaultRequestDeviceOptions(): RequestDeviceOptions | undefined {
    return this.sensorOptions.defaultRequestDeviceOptions;
  }

  /**
   * Constructs a new Sensor Service instance.
   * @param sensorOptions Options of the sensor module.
   */
  constructor(
    private readonly sensorOptions: SensorOptions,
  ) {}

  /**
   * Gets whether Bluetooth is supported by the browser or not.
   * @returns true = supported, false = not supported.
   */
  isBluetoothSupported(): boolean {
    return 'bluetooth' in navigator;
  }

  /**
   * Gets whether Bluetooth is available on the device.
   * @returns true = available, false = not available.
   */
  async isBluetoothAvailable(): Promise<boolean> {
    if (!this.isBluetoothSupported()) {
      return false;
    }
    return await navigator.bluetooth.getAvailability();
  }

  /**
   * Requests access to a bluetooth device from user.
   * @returns Granted bluetooth device.
   * @throws ERR_DEVICE_DISCOVERY_FAILED
   */
  private async requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice> {
    try {
      // Request Bluetooth device access.
      const device = await navigator.bluetooth.requestDevice(options ?? this.defaultRequestDeviceOptions);

      // Verify that a device was selected.
      if (!device) {
        throw 'No device selected';
      }
      return device;
    } catch (error) {
      console.error(`[ERROR] ${ERR_DEVICE_DISCOVERY_FAILED}:`, error);
      throw ERR_DEVICE_DISCOVERY_FAILED;
    }
  }

  /**
   * Connects a Bluetooth device.
   * @param device Bluetooth device to connect.
   * @returns Connected GATT Server.
   * @throws ERR_SERVER_CONNECTION_FAILED
   */
  private async connectServer(device: BluetoothDevice): Promise<BluetoothRemoteGATTServer> {
    try {
      // Verify that GATT server is available.
      if (!device.gatt) {
        throw 'GATT server is not available';
      }

      // Connect to GATT server.
      const server = await device.gatt.connect();

      // Verify that GATT server was found.
      if (!server) {
        throw 'GATT server not found';
      }
      return server;
    } catch (error) {
      console.error(`[ERROR] ${ERR_SERVER_CONNECTION_FAILED}:`, error);
      throw ERR_SERVER_CONNECTION_FAILED;
    }
  }

  /**
   * Connects a sensor.
   * @param options Request options. If undefined, defaultRequestDeviceOptions will be used.
   * @returns A new sensor instance.
   * @throws ERR_BLUETOOTH_NOT_SUPPORTED
   * @throws ERR_DEVICE_DISCOVERY_FAILED
   * @throws ERR_SERVER_CONNECTION_FAILED
   */
  async connectSensor(options?: RequestDeviceOptions): Promise<Sensor> {
    // Verify that Bluetooth API is supported.
    if (!this.isBluetoothSupported()) {
      console.error(`[ERROR] ${ERR_SERVER_CONNECTION_FAILED}:`, ERR_BLUETOOTH_NOT_SUPPORTED);
      throw ERR_BLUETOOTH_NOT_SUPPORTED;
    }

    var device: BluetoothDevice | undefined;
    var server: BluetoothRemoteGATTServer | undefined;

    try {
      // Request access to Bluetooth device.
      device = await this.requestDevice(options);
      // Connect to granted Bluetooth device.
      server = await this.connectServer(device);
      // Return new sensor instance.
      return new Sensor(device, server);
    } catch (error) {
      // Disconnect from server if connected.
      if (server) {
        server.disconnect();
      }
      // Forget device if found.
      if (device) {
        await device.forget();
      }
      throw error;
    }
  }
}
