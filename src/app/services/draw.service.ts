import { Injectable } from '@angular/core';
import { ImageService } from './image.service';

@Injectable({
  providedIn: 'root',
})
export class DrawService {
  constructor(public imageService: ImageService) {}

  public currentTool = 0;

  draw(arrX = [], arrY = []) {
    if (this.currentTool == 0) {
      this.imageService.colorPoint(arrX[1], arrY[1]);
    } else if (this.currentTool == 1) {
      this.imageService.drawLineEq(arrX, arrY);
    } else if(this.currentTool == 2){
      this.imageService.drawLinePar(arrX, arrY);
    } else if(this.currentTool == 3){
      this.imageService.drawLineBres(arrX, arrY);
    } else if (this.currentTool == 4) {
      this.imageService.drawCircleEq(arrX, arrY);
    } else if (this.currentTool == 5) {
      this.imageService.drawCirclePar(arrX, arrY);
    } else if (this.currentTool == 6) {
      this.imageService.drawCircleBres(arrX, arrY);
    }
  }
}
