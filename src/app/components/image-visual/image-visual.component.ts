import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { filter } from 'rxjs';
import { Imagem } from 'src/app/models/image';
import { ImageService } from 'src/app/services/image.service';

@Component({
  selector: 'app-image-visual',
  templateUrl: './image-visual.component.html',
  styleUrls: ['./image-visual.component.scss']
})
export class ImageVisualComponent implements OnInit {

  @ViewChild('draw') myCanvas: ElementRef;
  @ViewChild('drawR') myCanvasR: ElementRef;
  @ViewChild('drawG') myCanvasG: ElementRef;
  @ViewChild('drawB') myCanvasB: ElementRef;
  textoR: any = 0;
  textoG: any = 0;
  textoB: any = 0;
  textoH: any = 0;
  textoS: any = 0;
  textoL: any = 0;
  textoX: any = 0;
  textoY: any = 0;

  constructor(private imageService: ImageService) { }

  ngOnInit(): void {
  }
  
  drawOnCanvas(canvas: ElementRef, pic: Imagem, pesoR: number = 1, pesoG: number = 1, pesoB: number = 1 ){
    //console.log(this.myCanvas);
    const context = canvas.nativeElement.getContext('2d');
    canvas.nativeElement.width = pic.largura;
    canvas.nativeElement.height = pic.altura;
    for(let i = 0; i<pic.pixels.length; i++){
      context.fillStyle = `rgb(${pic.pixels[i].r*pesoR}, ${pic.pixels[i].g*pesoG}, ${pic.pixels[i].b*pesoB})`;
      context.fillRect(i%pic.largura, Math.floor(i/pic.largura), 1, 1);
    }
  }
  getMousePosition(event){
    const ctx = this.myCanvas.nativeElement.getContext('2d');
    let rect = this.myCanvas.nativeElement.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    let widthCanv = this.myCanvas.nativeElement.scrollWidth;
    let heightCanv = this.myCanvas.nativeElement.scrollHeight;
    let widthOrig = this.imageService.getLargura();
    let heightOrig =this.imageService.getAltura();
    let fator = Math.sqrt((heightCanv*widthCanv)/(heightOrig*widthOrig));
    x = Math.floor(x/fator);
    y = Math.floor(y/fator);
    var ImageData = ctx.getImageData(x, y, 1, 1);
    //console.log(ImageData);
    var hsl = this.imageService.RGBtoHSL(ImageData.data[0], ImageData.data[1], ImageData.data[2]);
    this.textoR = ImageData.data[0];
    this.textoG = ImageData.data[1];
    this.textoB = ImageData.data[2];
    this.textoH = hsl[0];
    this.textoS = hsl[1];
    this.textoL = hsl[2];
    
    this.textoX = Math.round(x);
    this.textoY = Math.round(y);
  }
  ngAfterViewInit(): void {
    this.imageService.pictureStream.pipe(
      filter((v)=> v != null)      
    ).subscribe((updatedPicture: Imagem)=>{
      this.drawOnCanvas(this.myCanvas, updatedPicture);
      this.drawOnCanvas(this.myCanvasR, updatedPicture, 1, 0, 0);
      this.drawOnCanvas(this.myCanvasG, updatedPicture, 0, 1, 0);
      this.drawOnCanvas(this.myCanvasB, updatedPicture, 0, 0, 1);
    });
    this.myCanvas.nativeElement.addEventListener("mousemove", (e)=>{
      if(this.imageService.isLoaded) this.getMousePosition(e);
      })
  }
}
