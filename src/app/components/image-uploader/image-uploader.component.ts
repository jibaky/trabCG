import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { filter } from 'rxjs';
import { Imagem } from 'src/app/models/image';
import { DrawService } from 'src/app/services/draw.service';
import { ImageService } from 'src/app/services/image.service';

@Component({
  selector: 'app-image-uploader',
  templateUrl: './image-uploader.component.html',
  styleUrls: ['./image-uploader.component.scss']
})
export class ImageUploaderComponent implements OnInit {

  constructor(public imageService: ImageService, public drawService: DrawService) { }

  @ViewChild('draw') myCanvas: ElementRef;

  ngOnInit(): void {
  }
  onChange(arq: File): void{
    if(!arq) return;
    this.imageService.upload(arq);
  }
  drawOnCanvas(pic: Imagem){
    //console.log(this.myCanvas);
    const context = this.myCanvas.nativeElement.getContext('2d');
    this.myCanvas.nativeElement.width = pic.largura;
    this.myCanvas.nativeElement.height = pic.altura;
    for(let i = 0; i<pic.pixels.length; i++){
      context.fillStyle = `rgb(${pic.pixels[i].r}, ${pic.pixels[i].g}, ${pic.pixels[i].b})`;
      context.fillRect(i%pic.largura, Math.floor(i/pic.largura), 1, 1);
    }
  }
  ngAfterViewInit(): void {
    this.imageService.originalStream.pipe(
      filter((v)=> v != null)      
    ).subscribe((updatedPicture: Imagem)=>{
      this.drawOnCanvas(updatedPicture);
    });
  }
}
