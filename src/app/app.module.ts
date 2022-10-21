import { ClipboardModule } from '@angular/cdk/clipboard';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCommonModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app/app.component';
import { ACTIVITY_SERVICE_UUID, BATTERY_SERVICE_UUID } from './config';
import { GraphComponent } from './graph/graph.component';
import { SensorModule } from './sensor/sensor.module';
import { EcgMonitorComponent } from './ecg-monitor/ecg-monitor.component';
import { MovMonitorComponent } from './mov-monitor/mov-monitor.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    EcgMonitorComponent,
    GraphComponent,
    MovMonitorComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ClipboardModule,
    FormsModule,
    MatButtonModule,
    MatCommonModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatSnackBarModule,
    MatToolbarModule,
    MatTooltipModule,
    SensorModule.forRoot({
      defaultRequestDeviceOptions: {
        filters: [
          {
            services: [
              ACTIVITY_SERVICE_UUID
            ],
          },
        ],
        optionalServices: [
          BATTERY_SERVICE_UUID,
        ],
      }
    }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
