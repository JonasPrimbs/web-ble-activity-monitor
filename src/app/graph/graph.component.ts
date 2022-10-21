import { Component, Input, OnInit } from '@angular/core';

import { Timeseries } from '../timeseries.interface';

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})
export class GraphComponent implements OnInit {

  @Input('caption')
  caption: string = '';

  @Input('showCaption')
  showCaption: boolean = true;

  @Input('showLegend')
  showLegend: boolean = false;

  @Input('showLatestValue')
  showLatestValue: boolean = true;

  @Input('data')
  data: Timeseries[] = [];

  constructor() { }

  ngOnInit(): void {
  }
}
