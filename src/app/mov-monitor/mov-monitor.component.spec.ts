import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovMonitorComponent } from './mov-monitor.component';

describe('MovMonitorComponent', () => {
  let component: MovMonitorComponent;
  let fixture: ComponentFixture<MovMonitorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MovMonitorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MovMonitorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
