import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';

import { SensorOptions } from './sensor-options.class';
import { SensorService } from './sensor.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
  ],
  providers: [
    {
      provide: SensorOptions,
      useValue: new SensorOptions(),
    },
    SensorService,
  ],
})
export class SensorModule {

  /**
   * Generates a dynamic Sensor Module.
   * @param options Module options.
   * @returns A dynamic Sensor Module instance.
   */
  static forRoot(options: SensorOptions): ModuleWithProviders<SensorModule> {
    return {
      ngModule: SensorModule,
      providers: [
        {
          provide: SensorOptions,
          useValue: options,
        },
        SensorService,
      ],
    };
  }
}
