import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root',
})
export class SensorOptions {

  /**
   * Default options to request Bluetooth devices with.
   */
  defaultRequestDeviceOptions?: RequestDeviceOptions;
}
