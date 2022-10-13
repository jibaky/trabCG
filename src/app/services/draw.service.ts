import { Injectable } from '@angular/core';
import { ImageService } from './image.service';

@Injectable({
  providedIn: 'root'
})
export class DrawService {

  constructor(public imageService: ImageService) { }

  public currentTool = 0;
  
  draw(x:number, y:number){
    if(this.currentTool == 0){
      this.imageService.colorPoint(x,y);
    }else if(this.currentTool == 1){
      console.log('1')
    }else if(this.currentTool == 2){
      console.log('2')
    }
  }

}
