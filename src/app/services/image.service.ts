import { AnimationDriver } from '@angular/animations/browser';
import { invalid } from '@angular/compiler/src/render3/view/util';
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
  private clipping: boolean = false;
  private clippingX: number[];
  private clippingY: number[];
  /** observable da imagem original */
  public originalStream = new BehaviorSubject(null);
  /** observable da imagem com alterações */
  public pictureStream = new BehaviorSubject(null);
  constructor() { }

  public changeColor(r: number, g: number, b: number){
    this.cor[0] = r;
    this.cor[1] = g;
    this.cor[2] = b;
  }

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
    this.clipping = false;
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
    for(let i = 0; i<l; i++){
      for(let j = 0; j<h; j++){
        const index = i*l+j;
        if(i == 0 || j == 0 || i == l-1 || j == h-1){
          this.pic.pixels[index].r = 0;
          this.pic.pixels[index].g = 0;
          this.pic.pixels[index].b = 0;
        }
      }
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
  public colorPoint(x, y, disableRendering = false){
    let largura = this.pic.largura,index = y*largura+x
    index = y*largura+x
    if(this.pic.pixels[index] != undefined){
      this.pic.pixels[index].r = this.cor[0]
      this.pic.pixels[index].g = this.cor[1]
      this.pic.pixels[index].b = this.cor[2]
    }
    if(disableRendering == false) this.pictureStream.next(this.pic);
  }
  public drawLineEq(arrX: number[], arrY: number[]){
    if(this.clipping) {
      let newArr = this.cohenSutherland(arrX, arrY);
      arrX = newArr[0];
      arrY = newArr[1];
      if(arrX[0] == 0 && arrX[1] == 0 && arrY[0] == 0 && arrY[1] == 0 ) return;
    }
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
          this.pic.pixels[index].r = this.cor[0];
          this.pic.pixels[index].g = this.cor[1];
          this.pic.pixels[index].b = this.cor[2];
        }
      }else if(arrX[0]>arrX[1]){
        for(let y = arrY[1]; y<arrY[0]; y++){
          let x = Math.round((y-arrY[0])/m+arrX[0]);
          const index = y*largura+x;
          this.pic.pixels[index].r = this.cor[0];
          this.pic.pixels[index].g = this.cor[1];
          this.pic.pixels[index].b = this.cor[2];
        }
      }
    }
    
    this.pictureStream.next(this.pic);
  }
  public drawLinePar(arrX: number[], arrY: number[]){
    if(this.clipping) {
      let newArr = this.cohenSutherland(arrX, arrY);
      arrX = newArr[0];
      arrY = newArr[1];
      if(arrX[0] == 0 && arrX[1] == 0 && arrY[0] == 0 && arrY[1] == 0 ) return;
    }
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
    if(this.clipping) {
      let newArr = this.cohenSutherland(arrX, arrY);
      arrX = newArr[0];
      arrY = newArr[1];
      if(arrX[0] == 0 && arrX[1] == 0 && arrY[0] == 0 && arrY[1] == 0 ) return;
    }
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

  public defineClippingArea(arrX: number[], arrY: number[]){
    const dX = arrX[1]-arrX[0], dY = arrY[1]-arrY[0], largura = this.pic.largura;
    let xP: number, xG: number, yP: number, yG: number;
    if(dX == 0 || dY == 0) return alert("area muito pequena");
    if(arrX[1]>arrX[0]){
      xP = arrX[0];
      xG = arrX[1];
    }
    else{
      xP = arrX[1];
      xG = arrX[0];
    }
    if(arrY[1]>arrY[0]){
      yP = arrY[0];
      yG = arrY[1];
    }
    else{
      yP = arrY[1];
      yG = arrY[0];
    }
    this.clipping = true;
    for(let i = xP; i<=xG; i++){
      let index = yP*largura+i;
      this.pic.pixels[index].r = 0;
      this.pic.pixels[index].g = 0;
      this.pic.pixels[index].b = 0;
      index = yG*largura+i;
      this.pic.pixels[index].r = 0;
      this.pic.pixels[index].g = 0;
      this.pic.pixels[index].b = 0;
    }
    for(let i = yP; i<=yG; i++){
      let index = i*largura+xP;
      this.pic.pixels[index].r = 0;
      this.pic.pixels[index].g = 0;
      this.pic.pixels[index].b = 0;
      index = i*largura+xG;
      this.pic.pixels[index].r = 0;
      this.pic.pixels[index].g = 0;
      this.pic.pixels[index].b = 0;
    }
    this.clippingX = [xP, xG];
    this.clippingY = [yP, yG];
    this.pictureStream.next(this.pic);
  }

  public cohenSutherland(arrX: number[], arrY: number[]){
    let cod1 = [], cod2 = [];
    if(arrY[0]<this.clippingY[0]) cod1.push(1)
    else cod1.push(0);
    if(arrY[1]<this.clippingY[0]) cod2.push(1)
    else cod2.push(0);

    if(arrY[0]>this.clippingY[1]) cod1.push(1)
    else cod1.push(0);
    if(arrY[1]>this.clippingY[1]) cod2.push(1)
    else cod2.push(0);

    if(arrX[0]>this.clippingX[1]) cod1.push(1)
    else cod1.push(0);
    if(arrX[1]>this.clippingX[1]) cod2.push(1)
    else cod2.push(0);

    if(arrX[0]<this.clippingX[0]) cod1.push(1)
    else cod1.push(0);
    if(arrX[1]<this.clippingX[0]) cod2.push(1)
    else cod2.push(0);
    
    let contOut = 0, contInside = 0, and = [];
    let cont1 = 0, cont2 = 0;
    for(let i = 0; i<cod1.length; i++){
      if(cod1[i] == 1 && cod2[i] == 1 && cod1[i] == cod2[i]) and.push(1);
      else and.push(0);
      if(cod1[i] == cod2[i]) contInside++;
      if(and[i] == 0) contOut++;
      if(cod1[i] == 1) cont1++
      if(cod2[i] == 1) cont2++
    }
    if(contInside == 4) return [arrX, arrY];
    else if(contOut != 4) {
      arrX = [0,0];
      arrY = [0,0];
      return [arrX, arrY];
    }

    let m = (arrY[1]-arrY[0])/(arrX[1]-arrX[0])
    let x1 = 0, y1 = 0, x2 = 0, y2 = 0, x3 = 0, y3 = 0, x4 = 0, y4 = 0;
    
    if(cont1 != 0){
      console.log('cod1')
      y1 = this.clippingY[0]; // cima
      x1 = Math.round((y1-arrY[0])/m+arrX[0]);

      y2 = this.clippingY[1]; // baixo
      x2 = Math.round((y2-arrY[0])/m+arrX[0]);

      x3 = this.clippingX[1]; // direita
      y3 = Math.round(m*(x3-arrX[0])+arrY[0]);

      x4 = this.clippingX[0]; // esquerda
      y4 = Math.round(m*(x4-arrX[0])+arrY[0]);
      // console.log(x1,y1, x2,y2, x3,y3, x4,y4);

      if(x1 > this.clippingX[0] && x1 < this.clippingX[1] && cod1[0] == 1){
        console.log('1 - 0')
        arrX[0] = x1;
        arrY[0] = y1;
      }
      else if(x2 > this.clippingX[0] && x2 < this.clippingX[1] && cod1[1] == 1){
        console.log('1 - 1')
        arrX[0] = x2;
        arrY[0] = y2;
      }
      else if(y3 > this.clippingY[0] && y3 < this.clippingY[1] && cod1[2] == 1){
        console.log('1 - 2')
        arrX[0] = x3;
        arrY[0] = y3;
      }
      else if(y4 > this.clippingY[0] && y4 < this.clippingY[1] && cod1[3] == 1){
        console.log('1 - 3')
        arrX[0] = x4;
        arrY[0] = y4;
      }
    }

    x1 = 0, y1 = 0, x2 = 0, y2 = 0, x3 = 0, y3 = 0, x4 = 0, y4 = 0;
    
    console.log(cod1, cont1, cod2, cont2)
    console.log(arrX, arrY)
    console.log(this.clippingX, this.clippingY)

    if(cont2 != 0){
      console.log('cod2')
      y1 = this.clippingY[0]; // cima
      x1 = Math.round((y1-arrY[0])/m+arrX[1]);

      y2 = this.clippingY[1]; // baixo
      x2 = Math.round((y2-arrY[0])/m+arrX[1]);

      x3 = this.clippingX[1]; // direita
      y3 = Math.round(m*(x3-arrX[0])+arrY[1]);

      x4 = this.clippingX[0]; // esquerda
      y4 = Math.round(m*(x4-arrX[0])+arrY[1]);
      console.log(x1,y1, x2,y2, x3,y3, x4,y4);
      if(x1 > this.clippingX[0] && x1 < this.clippingX[1] && cod2[0] == 1){
        console.log('2 - 0')
        arrX[1] = x1;
        arrY[1] = y1;
      }
      else if(x2 > this.clippingX[0] && x2 < this.clippingX[1] && cod2[1] == 1){
        console.log('2 - 1')
        arrX[1] = x2;
        arrY[1] = y2;
      }
      else if(y3 > this.clippingY[0] && y3 < this.clippingY[1] && cod2[2] == 1){
        console.log('2 - 2')
        arrX[1] = x3;
        arrY[1] = y3;
      }
      else if(y4 > this.clippingY[0] && y4 < this.clippingY[1] && cod2[3] == 1){
        console.log('2 - 3')
        arrX[1] = x4;
        arrY[1] = y4;
      }
    }
    console.log(arrX, arrY)
    return [arrX, arrY];
  }
  private checkValidityFloodFill(x: number, y:number, color: number[], colored: number[], stack: number[]): boolean{
    if(x < 0) return false;
    if(x >= this.pic.largura) return false;
    if(y < 0) return false;
    if(y >= this.pic.altura) return false;
    const index = y*this.pic.largura+x;
    if(this.pic.pixels[index].r != color[0] &&
       this.pic.pixels[index].g != color[1] &&
       this.pic.pixels[index].b != color[2]) return false;
    if(this.pic.pixels[index].r == this.cor[0] && 
       this.pic.pixels[index].g == this.cor[1] &&
       this.pic.pixels[index].b == this.cor[2]) return false;
    if(colored.includes(index)) return false
    if(stack.includes(index)) return false;
    return true
  }

  public floodFill4(x: number, y:number): void{
    let index = y*this.pic.largura+x;
    const largura = this.pic.largura, color = [this.pic.pixels[index].r, this.pic.pixels[index].g, this.pic.pixels[index].b];
    if(color[0] == this.cor[0] && color[1] == this.cor[1] && color[2] == this.cor[2]) return;
    let stack1 = [];
    let stack2 = []
    let colored = [];
    stack1.push([x,y])
    stack2.push(y*largura+x)
    while(stack1.length != 0){
      const coord = stack1.shift()
      stack2.shift()
      x = coord[0];
      y = coord[1];
      index = y*largura+x;
      colored.push(index);
      this.colorPoint(x, y, true);
      if(this.checkValidityFloodFill(x,y-1,color, colored, stack2)){
        stack1.push([x,y-1]);
        stack2.push((y-1)*largura+x)
      }
      if(this.checkValidityFloodFill(x-1,y,color, colored, stack2)){
        stack1.push([x-1,y]);
        stack2.push(y*largura+(x-1))
      }
      if(this.checkValidityFloodFill(x+1,y,color, colored, stack2)){
        stack1.push([x+1,y]);
        stack2.push(y*largura+(x+1))
      }
      if(this.checkValidityFloodFill(x,y+1,color, colored, stack2)){
        stack1.push([x,y+1]);
        stack2.push((y+1)*largura+x)
      }
    }
    this.pictureStream.next(this.pic);
    return;
  }

  public floodFill8(x: number, y:number): void{
    let index = y*this.pic.largura+x;
    const largura = this.pic.largura, color = [this.pic.pixels[index].r, this.pic.pixels[index].g, this.pic.pixels[index].b];
    if(color[0] == this.cor[0] && color[1] == this.cor[1] && color[2] == this.cor[2]) return;
    let stack1 = [];
    let stack2 = [];
    let colored = [];
    stack1.push([x,y])
    stack2.push(y*largura+x)
    while(stack1.length != 0){
      const coord = stack1.shift()
      stack2.shift()
      x = coord[0];
      y = coord[1];
      index = y*largura+x;
      colored.push(index);
      this.colorPoint(x, y, true)
      for(let i = -1; i<2; i++){
        for(let j = -1; j<2; j++){
          if(this.checkValidityFloodFill(x+j,y+i,color, colored, stack2)){
            stack1.push([x+j,y+i]);
            stack2.push((y+i)*largura+(x+j))
          }
        }
      }
    }
    this.pictureStream.next(this.pic);
    return;
  }
}