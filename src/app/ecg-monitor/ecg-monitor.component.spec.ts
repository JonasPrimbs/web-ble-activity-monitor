import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EcgMonitorComponent } from './ecg-monitor.component';

describe('EcgMonitorComponent', () => {
  let component: EcgMonitorComponent;
  let fixture: ComponentFixture<EcgMonitorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EcgMonitorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EcgMonitorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
