import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Imagem, Pixel } from '../models/image';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  public isLoaded: boolean = false;
  public cor = 0
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
  createImage(r: number, g: number, b: number){
    if(r==g && r==b) this.pic.tipo = "P2"
    else this.pic.tipo = "P3"
    let inicioPixels = 3;
    this.pic.largura = 32;
    this.pic.altura = 32;
    this.pic.valMax = 256;
    let tam = this.pic.largura * this.pic.altura;
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
      this.pic.pixels[index].r = this.cor
      this.pic.pixels[index].g = this.cor
      this.pic.pixels[index].b = this.cor
    }
    this.pictureStream.next(this.pic);
  }
  public drawLinePar(arrX: number[], arrY: number[]){
    const largura = this.pic.largura, vX = arrX[1]-arrX[0], vY = arrY[1]-arrY[0];
    for(let t = 0; t<1; t+=0.01){
      const x = Math.floor(arrX[0]+vX*t), y = Math.floor(arrY[0]+vY*t);
      const index = y*largura+x;
      this.pic.pixels[index].r = this.cor;
      this.pic.pixels[index].g = this.cor;
      this.pic.pixels[index].b = this.cor;
    }
    this.pictureStream.next(this.pic);
  }
  public drawCircleEq(arrX: number[], arrY: number[]){ 
    const rad = Math.abs(arrX[0]-arrX[1]);
    const largura = this.pic.largura;
    for(let x = -rad; x<rad; x+=1){
      const y = Math.floor(Math.sqrt(rad*rad - x*x));
      let index = (arrY[0]+y)*largura+(arrX[0]+x);
      if(this.pic.pixels[index] != undefined){
        this.pic.pixels[index].r = this.cor;
        this.pic.pixels[index].g = this.cor;
        this.pic.pixels[index].b = this.cor;
      }
      index = (arrY[0]-y)*largura+(arrX[0]+x);
      if(this.pic.pixels[index] != undefined){
        this.pic.pixels[index].r = this.cor;
        this.pic.pixels[index].g = this.cor;
        this.pic.pixels[index].b = this.cor;
      }
    }
    this.pictureStream.next(this.pic);
  }
  public drawCirclePar(arrX: number[], arrY: number[]){
    this.colorPoint(arrX[0], arrY[0])
    const pi = 3.14, rad = Math.abs(arrX[0]-arrX[1]), largura = this.pic.largura;
    for(let a = 0; a<2*pi; a+=0.01){
      let x = Math.round(rad * Math.cos(a));
      let y = Math.round(rad * Math.sin(a));
      let index = (arrY[0]+y)*largura+(arrX[0]+x);
      if(this.pic.pixels[index] != undefined){
        this.pic.pixels[index].r = this.cor;
        this.pic.pixels[index].g = this.cor;
        this.pic.pixels[index].b = this.cor;
      }
    }
    this.pictureStream.next(this.pic);
  }
}
