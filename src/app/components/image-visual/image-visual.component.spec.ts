import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageVisualComponent } from './image-visual.component';

describe('ImageVisualComponent', () => {
  let component: ImageVisualComponent;
  let fixture: ComponentFixture<ImageVisualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImageVisualComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageVisualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
