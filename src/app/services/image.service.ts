import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Imagem, Pixel } from '../models/image';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  public isLoaded: boolean = false;
  public cor = [0,0,0];
  private pic: Imagem = new Imagem();
  /** observable da imagem original */
  public originalStream = new BehaviorSubject(null);
  /** observable da imagem com alterações */
  public pictureStream = new BehaviorSubject(null);
  constructor() { }

  upload(arquivo: File): Promise<boolean>{
    return new Promise((resolve, reject)=>{
      //if(!['image/x-portable-graymap'].includes(arquivo.type)) reject(false);
      let leitor = new FileReader();
      leitor.onloadend=(e)=>{
        const arrDados = String(leitor.result).split('\n');
        this.pic.tipo = arrDados[0];
        const d = arrDados[1].split(' ');
        let inicioPixels = 3;
        if(d.length == 1) {
          this.pic.largura = Number(arrDados[1]);
          this.pic.altura = Number(arrDados[2]);
          this.pic.valMax = Number(arrDados[3]);
          inicioPixels = 4;
        }
        else{
          this.pic.largura = Number(d[0]);
          this.pic.altura = Number(d[1]);
          this.pic.valMax = Number(arrDados[2]);
        }
        if(this.pic.tipo == 'P2') {
          this.pic.pixels = this.loadPGM(arrDados, inicioPixels);
        }
        if(this.pic.tipo == 'P3') {
          this.pic.pixels = this.loadPPM(arrDados, inicioPixels);
        }
        //console.log(this.pic.pixels);
        this.originalStream.next(this.pic);
        this.pictureStream.next(this.pic);
        this.isLoaded = true;
        resolve(true);
      };
      leitor.readAsText(arquivo);

    });
  }
  createImage(r: number, g: number, b: number, h: number, l: number){
    if(r==g && r==b) this.pic.tipo = "P2"
    else this.pic.tipo = "P3"
    this.pic.largura = h;
    this.pic.altura = l;
    this.pic.valMax = 255;
    let tam = h*l;
    if(this.pic.tipo == 'P2') {
      let arrDados = Array(tam).fill(r)
      this.pic.pixels = this.loadPGM(arrDados, 0);
    }
    if(this.pic.tipo == 'P3') {
      let arrDados = []
      for (let i = 0; i < tam; i++) {
        arrDados.push(r);
        arrDados.push(g);
        arrDados.push(b);
      }
      this.pic.pixels = this.loadPPM(arrDados, 0);
    }
    this.originalStream.next(this.pic);
    this.pictureStream.next(this.pic);
    this.isLoaded = true;
  }
  private loadPGM(dados: Array<String>, offset: number): Pixel[]{
    const pixels=[];
    for(let i = offset; i<dados.length; i++){
      if(dados[i]!=="")pixels.push(new Pixel(Number(dados[i])));
    }
    return pixels;
  }
  private loadPPM(dados: Array<String>, offset: number): Pixel[]{
    const pixels=[];
    for(let i = offset; i<dados.length; i=i+3){
      if(dados[i]!=="")pixels.push(new Pixel(Number(dados[i]), Number(dados[i+1]), Number(dados[i+2])));
    }
    return pixels;
  }
  public getAltura(){
    return this.pic.altura;
  }

  public getLargura(){
    return this.pic.largura;
  }
  public RGBtoHSL(r, g, b){
    if(r == g && r == g && r>=255/3 && r<=2*255/3){
      this.cor[0] = 0;
      this.cor[1] = 0;
      this.cor[2] = 0;
    }
    else{
      this.cor[0] = 255-r;
      this.cor[1] = 255-g;
      this.cor[2] = 255-b;
    }
    if(r>255 || g>255 || b>255){
      alert("nao funciona com valores maiores do que 255");
      return [0,0,0]
    }
    r/=255, g/=255, b/=255;
    let cmin = Math.min(r,g,b),
        cmax = Math.max(r,g,b),
        delta = cmax-cmin,
        h=0, s=0, l=0;
    
    if(delta == 0) h=0;
    else if(cmax == r) h = ((g - b) / delta) % 6;
    else if(cmax == g) h = (b - r) / delta + 2;
    else  h = (r - g) / delta + 4;
    h = Math.round(h*40);
    if( h < 0 ) h+=240;

    l = (cmax+cmin)/2;

    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    s = +(s * 240);
    l = +(l * 240);

    return [Math.round(h),Math.round(s),Math.round(l)]
  }
  private hue2rgb(p, q, t){
    if(t < 0) t += 1;
    if(t > 1) t -= 1;
    if(t < 1/6) return p + (q - p) * 6 * t;
    if(t < 1/2) return q;
    if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }
  public HSltoRGB(h, s, l){
    if(h>239 || s>240 || l>240){
      alert("nao funciona com valores maiores do que 240");
      return [0,0,0]
    }
    h /= 240, s /= 240, l /= 240
    let r, g, b;
    if(s == 0) r = g = b = l; //escala de cinza
    else{
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = this.hue2rgb(p, q, h + 1/3);
      g = this.hue2rgb(p, q, h);
      b = this.hue2rgb(p, q, h - 1/3);
    }
    
    return [Math.round(r*255), Math.round(g*255), Math.round(b*255)]
  }
  public greyScale(){
    if(this.pic.tipo == "P2") return;
    for(let i=0; i<this.pic.pixels.length; i++){
      //const media = Math.floor((element.r + element.g + element.b)/3);
      const media = Math.floor(0.299*this.pic.pixels[i].r+0.587*this.pic.pixels[i].g+0.114*this.pic.pixels[i].b)
      this.pic.pixels[i].r = media;
      this.pic.pixels[i].g = media;
      this.pic.pixels[i].b = media;
    }
    this.pic.tipo = "P2"
    this.pictureStream.next(this.pic);
  }
  public negative(){
    for(let i=0; i<this.pic.pixels.length; i++){
      const max = this.pic.valMax;
      this.pic.pixels[i].r = max-this.pic.pixels[i].r;
      this.pic.pixels[i].g = max-this.pic.pixels[i].g;
      this.pic.pixels[i].b = max-this.pic.pixels[i].b;
    }
    this.pictureStream.next(this.pic);
  }
  public colorPoint(x, y){
    let largura = this.pic.largura,index = y*largura+x
    index = y*largura+x
    if(this.pic.pixels[index] != undefined){
      this.pic.pixels[index].r = this.cor[0]
      this.pic.pixels[index].g = this.cor[1]
      this.pic.pixels[index].b = this.cor[2]
    }
    this.pictureStream.next(this.pic);
  }
  public drawLineEq(arrX: number[], arrY: number[]){
    const largura = this.pic.largura, m = (arrY[1]-arrY[0])/(arrX[1]-arrX[0]), vX = arrX[1]-arrX[0], vY = arrY[1]-arrY[0];
    if(arrX[0] == arrX[1]){
      if(arrY[0]< arrY[1]){
        for(let y = arrY[0]; y<arrY[1]; y++){
          const index = y*largura+arrX[0];
          this.pic.pixels[index].r = this.cor[0];
          this.pic.pixels[index].g = this.cor[1];
          this.pic.pixels[index].b = this.cor[2];
        }
      }else{
        for(let y = arrY[1]; y<arrY[0]; y++){
          const index = y*largura+arrX[0];
          this.pic.pixels[index].r = this.cor[0];
          this.pic.pixels[index].g = this.cor[1];
          this.pic.pixels[index].b = this.cor[2];
        }
      }
    }
    else if(arrY[0] == arrY[1]){
      if(arrX[0]< arrX[1]){
        for(let x = arrX[0]; x<arrX[1]; x++){
          const index = arrY[0]*largura+x;
          this.pic.pixels[index].r = this.cor[0];
          this.pic.pixels[index].g = this.cor[1];
          this.pic.pixels[index].b = this.cor[2];
        }
      }else{
        for(let x = arrX[1]; x<arrX[0]; x++){
          const index = arrY[0]*largura+x;
          this.pic.pixels[index].r = this.cor[0];
          this.pic.pixels[index].g = this.cor[1];
          this.pic.pixels[index].b = this.cor[2];
        }
      }
    }
    else if(vX>vY){
      if(arrX[0]<arrX[1]){
        for(let x = arrX[0]; x<arrX[1]; x++){
          let y = Math.round(m*(x-arrX[1])+arrY[1]);
          const index = y*largura+x;
          this.pic.pixels[index].r = this.cor[0];
          this.pic.pixels[index].g = this.cor[1];
          this.pic.pixels[index].b = this.cor[2];
        }
      }else if(arrX[0]>arrX[1]){
        for(let x = arrX[1]; x<arrX[0]; x++){
          let y = Math.round(m*(x-arrX[1])+arrY[1]);
          const index = y*largura+x;
          this.pic.pixels[index].r = this.cor[0];
          this.pic.pixels[index].g = this.cor[1];
          this.pic.pixels[index].b = this.cor[2];
        }
      }
    }else if(vX<vY){
      if(arrY[0]<arrY[1]){
        for(let y = arrY[0]; y<arrY[1]; y++){
          let x = Math.round((y-arrY[0])/m+arrX[0]);
          const index = y*largura+x;
          console.log(index)
          this.pic.pixels[index].r = this.cor[0];
          this.pic.pixels[index].g = this.cor[1];
          this.pic.pixels[index].b = this.cor[2];
        }
      }else if(arrX[0]>arrX[1]){
        for(let y = arrY[1]; y<arrY[0]; y++){
          let x = Math.round((y-arrY[0])/m+arrX[0]);
          const index = y*largura+x;
          console.log(index, x)
          this.pic.pixels[index].r = this.cor[0];
          this.pic.pixels[index].g = this.cor[1];
          this.pic.pixels[index].b = this.cor[2];
        }
      }
    }
    
    this.pictureStream.next(this.pic);
  }
  public drawLinePar(arrX: number[], arrY: number[]){
    const largura = this.pic.largura, vX = arrX[1]-arrX[0], vY = arrY[1]-arrY[0];
    for(let t = 0; t<1; t+=0.01){
      const x = Math.floor(arrX[0]+vX*t), y = Math.floor(arrY[0]+vY*t);
      const index = y*largura+x;
      this.pic.pixels[index].r = this.cor[0];
      this.pic.pixels[index].g = this.cor[1];
      this.pic.pixels[index].b = this.cor[2];
    }
    this.pictureStream.next(this.pic);
  }
  public drawLineBres(arrX: number[], arrY: number[]){
    let dX = arrX[1]-arrX[0], dY = arrY[1]-arrY[0];
    if(Math.abs(dY) < Math.abs(dX)){
      if(arrX[0] > arrX[1]) this.bresLow(arrX[1], arrY[1], arrX[0], arrY[0]); // 135º - 225º
      else this.bresLow(arrX[0], arrY[0], arrX[1], arrY[1]); // 315º - 45º
    }
    else{
      if(arrY[0] > arrY[1]) this.bresHigh(arrX[1], arrY[1], arrX[0], arrY[0]); // 45º - 135º
      else this.bresHigh(arrX[0], arrY[0], arrX[1], arrY[1]); // 225º - 315º
    }
    const index = arrY[1]*this.pic.largura+arrX[1]
    this.pic.pixels[index].r = this.cor[0];
    this.pic.pixels[index].g = this.cor[1];
    this.pic.pixels[index].b = this.cor[2];
    this.pictureStream.next(this.pic);
  }
  private bresLow(x1: number, y1: number, x2: number, y2: number){ // desenha linhas com dY maior que dX
    let dX = x2-x1, dY = y2-y1, incY = 1, y = y1;
    const largura = this.pic.largura;
    if(dY<0){
      incY = -1;
      dY = -dY
    }
    let d = (2 * dY) - dX;
    for(let x = x1; x<x2; x++){
      const index = y*largura+x
      this.pic.pixels[index].r = this.cor[0];
      this.pic.pixels[index].g = this.cor[1];
      this.pic.pixels[index].b = this.cor[2];
      if (d>0){
        y = y + incY;
        d = d + (2 * (dY - dX))
      }
      else d = d + 2 * dY
    }
  }
  private bresHigh(x1: number, y1: number, x2: number, y2: number){ // desenha linhas com dX maior que o dY
    let dX = x2-x1, dY = y2-y1, incX = 1, x = x1;
    const largura = this.pic.largura;
    if(dX<0){
      incX = -1;
      dX = -dX
    }
    let d = (2 * dX) - dY;
    for(let y = y1; y<y2; y++){
      const index = y*largura+x
      this.pic.pixels[index].r = this.cor[0];
      this.pic.pixels[index].g = this.cor[1];
      this.pic.pixels[index].b = this.cor[2];
      if (d>0){
        x = x + incX;
        d = d + (2 * (dX - dY))
      }
      else d = d + 2 * dX
    }
  }
  public drawCircleEq(arrX: number[], arrY: number[]){ 
    const dX = arrX[1]-arrX[0], dY = arrY[1]-arrY[0], largura = this.pic.largura;
    const rad = Math.round(Math.sqrt(dX*dX+dY*dY));
    for(let x = -rad; x<rad; x+=1){
      const y = Math.floor(Math.sqrt(rad*rad - x*x));
      if(arrX[0]+x < 0 || arrX[0]+x > largura) continue;
      // if(y>this.pic.altura || y<0) continue;
      let index = (arrY[0]+y)*largura+(arrX[0]+x);
      if(this.pic.pixels[index] != undefined){
        this.pic.pixels[index].r = this.cor[0];
        this.pic.pixels[index].g = this.cor[1];
        this.pic.pixels[index].b = this.cor[2];
      }
      index = (arrY[0]-y)*largura+(arrX[0]+x);
      if(this.pic.pixels[index] != undefined){
        this.pic.pixels[index].r = this.cor[0];
        this.pic.pixels[index].g = this.cor[1];
        this.pic.pixels[index].b = this.cor[2];
      }
    }
    this.pictureStream.next(this.pic);
  }
  public drawCirclePar(arrX: number[], arrY: number[]){
    const dX = arrX[1]-arrX[0], dY = arrY[1]-arrY[0], largura = this.pic.largura;
    const pi = 3.14, rad = Math.round(Math.sqrt(dX*dX+dY*dY));
    for(let a = 0; a<2*pi; a+=0.01){
      let x = Math.round(rad * Math.cos(a));
      let y = Math.round(rad * Math.sin(a));
      if(arrX[0]+x < 0 || arrX[0]+x > largura) continue;
      let index = (arrY[0]+y)*largura+(arrX[0]+x);
      if(this.pic.pixels[index] != undefined){
        this.pic.pixels[index].r = this.cor[0];
        this.pic.pixels[index].g = this.cor[1];
        this.pic.pixels[index].b = this.cor[2];
      }
    }
    this.pictureStream.next(this.pic);
  }
  public drawCircleBres(arrX: number[], arrY: number[]){
    const centerX = Math.floor(this.pic.largura/2), centerY = Math.floor(this.pic.altura/2);
    const dX = arrX[1]-arrX[0], dY = arrY[1]-arrY[0], largura = this.pic.largura;
    const r = Math.round(Math.sqrt(dX*dX+dY*dY))
    let x = 0, y=r, h = 1-r, de = 3, dse = -2*r+5, x1, y1, x2, y2;
    let index = (y+centerY)*largura+(x+centerX)
    this.pic.pixels[index].r = this.cor[0];
    this.pic.pixels[index].g = this.cor[1];
    this.pic.pixels[index].b = this.cor[2];
    console.log(r);
    let color = 20;
    while(x<y){
      if(h<0){
        h = h+de;
        de = de+2;
        dse = dse+2
      }
      else{
        h = h+dse;
        de = de+2;
        dse = dse+4;
        y = y-1;
      }

      // x1 = x;
      // y1 = y;
      // for(let i = 0; i<8; i++){
      //   index = (centerY+y1)*largura+(centerX+x1)
      //   console.log(x1,y1);
      //   if(this.pic.pixels[index] != undefined){
      //   this.pic.pixels[index].r = this.cor[0];
      //   this.pic.pixels[index].g = this.cor[1];
      //   this.pic.pixels[index].b = this.cor[2];
      //   }
      //   x2 = x1;
      //   y2 = y1;
      //   x1 = Math.round(x2*0.70710678118-y2*0.70710678118)
      //   y1 = Math.round(x2*0.70710678118+y2*0.70710678118)
      // }

    index = (centerY+y)*largura+(centerX+x) // vermelho
    if(this.pic.pixels[index] != undefined){
      this.pic.pixels[index].r = this.cor[0];
      this.pic.pixels[index].g = this.cor[1];
      this.pic.pixels[index].b = this.cor[2];
      // this.pic.pixels[index].r = 255;
      // this.pic.pixels[index].g = 0;
      // this.pic.pixels[index].b = 0;
    }
    index = (centerY+x)*largura+(centerX-y) // azul
    if(this.pic.pixels[index] != undefined){
      this.pic.pixels[index].r = this.cor[0];
      this.pic.pixels[index].g = this.cor[1];
      this.pic.pixels[index].b = this.cor[2];
      // this.pic.pixels[index].r = 0;
      // this.pic.pixels[index].g = 0;
      // this.pic.pixels[index].b = 255;
    }
    index = (centerY-y)*largura+(centerX-x); // verde
    if(this.pic.pixels[index] != undefined){
      this.pic.pixels[index].r = this.cor[0];
      this.pic.pixels[index].g = this.cor[1];
      this.pic.pixels[index].b = this.cor[2];
      // this.pic.pixels[index].r = 0;
      // this.pic.pixels[index].g = 255;
      // this.pic.pixels[index].b = 0;
    }
    index = (centerY-x)*largura+(centerX+y); // branco
    if(this.pic.pixels[index] != undefined){
      this.pic.pixels[index].r = this.cor[0];
      this.pic.pixels[index].g = this.cor[1];
      this.pic.pixels[index].b = this.cor[2];
      // this.pic.pixels[index].r = 255;
      // this.pic.pixels[index].g = 255;
      // this.pic.pixels[index].b = 255;
    }

      index = (centerY+y)+largura*(centerX+x) // preto
      if(this.pic.pixels[index] != undefined){
        this.pic.pixels[index].r = this.cor[0];
        this.pic.pixels[index].g = this.cor[1];
        this.pic.pixels[index].b = this.cor[2];
        // this.pic.pixels[index].r = 0;
        // this.pic.pixels[index].g = 0;
        // this.pic.pixels[index].b = 0;
      }  
      index = (centerY-x)+largura*(centerX+y) // rosa
      if(this.pic.pixels[index] != undefined){
        this.pic.pixels[index].r = this.cor[0];
        this.pic.pixels[index].g = this.cor[1];
        this.pic.pixels[index].b = this.cor[2];
        // this.pic.pixels[index].r = 255;
        // this.pic.pixels[index].g = 0;
        // this.pic.pixels[index].b = 255;
      }
      index = (centerY-y)+largura*(centerX-x); // ciano
      if(this.pic.pixels[index] != undefined){
        this.pic.pixels[index].r = this.cor[0];
        this.pic.pixels[index].g = this.cor[1];
        this.pic.pixels[index].b = this.cor[2];
        // this.pic.pixels[index].r = 0;
        // this.pic.pixels[index].g = 255;
        // this.pic.pixels[index].b = 255;
      }
      index = (centerY+x)+largura*(centerX-y); // amarelo
      if(this.pic.pixels[index] != undefined){
        this.pic.pixels[index].r = this.cor[0];
        this.pic.pixels[index].g = this.cor[1];
        this.pic.pixels[index].b = this.cor[2];
        // this.pic.pixels[index].r = 255;
        // this.pic.pixels[index].g = 255;
        // this.pic.pixels[index].b = 0;
      }
      x = x+1
    }
    
    this.pictureStream.next(this.pic);
  }
}
