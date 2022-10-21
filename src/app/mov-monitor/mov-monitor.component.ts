import { Component, Input, OnInit } from '@angular/core';

import { Timeseries } from '../timeseries.interface';

@Component({
  selector: 'app-mov-monitor',
  templateUrl: './mov-monitor.component.html',
  styleUrls: ['./mov-monitor.component.scss']
})
export class MovMonitorComponent implements OnInit {

  @Input('activityService')
  activityService?: BluetoothRemoteGATTService;

  accData: Timeseries[] = [
    { name: 'X', values: [] },
    { name: 'Y', values: [] },
    { name: 'Z', values: [] },
  ];

  gyrData: Timeseries[] = [
    { name: 'X', values: [] },
    { name: 'Y', values: [] },
    { name: 'Z', values: [] },
  ];

  magData: Timeseries[] = [
    { name: 'X', values: [] },
    { name: 'Y', values: [] },
    { name: 'Z', values: [] },
  ];

  constructor() { }

  ngOnInit(): void {
  }

}
