import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  Coord3D,
  Coord3DHomogenea,
  Line,
  Line3D,
  VectorImage3D,
} from 'src/app/models/vector';

@Component({
  selector: 'app-projections',
  templateUrl: './projections.component.html',
  styleUrls: ['./projections.component.scss'],
})
export class ProjectionsComponent implements OnInit {
  casa = new VectorImage3D();

  transformationMatrix = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];

  scaleXYZ = [1, 1, 1];
  scaleGlobal = 1;
  translationXYZ = [0, 0, 0];
  rotationAxis = 'x';
  rotationDegrees = 0;

  mode: string;

  @ViewChild('canvasElement') canvas: ElementRef;

  constructor() {
    this.casa.lines = [
      new Line3D(new Coord3D(50, 150, 0), new Coord3D(50, 150, 100)),
      new Line3D(new Coord3D(50, 150, 0), new Coord3D(0, 100, 0)),
      new Line3D(new Coord3D(50, 150, 0), new Coord3D(100, 100, 0)),
      new Line3D(new Coord3D(50, 150, 100), new Coord3D(100, 100, 100)),
      new Line3D(new Coord3D(50, 150, 100), new Coord3D(0, 100, 100)),
      new Line3D(new Coord3D(0, 100, 0), new Coord3D(0, 0, 0)),
      new Line3D(new Coord3D(0, 100, 0), new Coord3D(0, 100, 100)),
      new Line3D(new Coord3D(100, 100, 0), new Coord3D(100, 0, 0)),
      new Line3D(new Coord3D(100, 100, 0), new Coord3D(100, 100, 100)),
      new Line3D(new Coord3D(0, 0, 0), new Coord3D(100, 0, 0)),
      new Line3D(new Coord3D(0, 0, 0), new Coord3D(0, 0, 100)),
      new Line3D(new Coord3D(100, 0, 0), new Coord3D(100, 0, 100)),
      new Line3D(new Coord3D(100, 0, 100), new Coord3D(0, 0, 100)),
      new Line3D(new Coord3D(0, 100, 100), new Coord3D(0, 0, 100)),
      new Line3D(new Coord3D(100, 100, 100), new Coord3D(100, 0, 100)),
    ];
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.canvas.nativeElement.width = 400;
    this.canvas.nativeElement.height = 400;
    this.render();
  }

  cavaleira(image: VectorImage3D): Line3D[] {
    const l = 1;
    const teta = Math.PI / 4;
    return image.lines.map((line) => {
      const startX = line.start.x + line.start.z * l * Math.cos(teta);
      const startY = line.start.y + line.start.z * l * Math.sin(teta);
      const startZ = 0;
      const startHomo = 1;

      const endX = line.end.x + line.end.z * l * Math.cos(teta);
      const endY = line.end.y + line.end.z * l * Math.sin(teta);
      const endZ = 0;
      const endHomo = 1;

      return new Line3D(
        new Coord3D(startX / startHomo, startY / startHomo, startZ / startHomo),
        new Coord3D(endX / endHomo, endY / endHomo, endZ / endHomo)
      );
    });
  }

  render(): void {
    const ctx: CanvasRenderingContext2D =
      this.canvas.nativeElement.getContext('2d');
    ctx.clearRect(
      0,
      0,
      this.canvas.nativeElement.width,
      this.canvas.nativeElement.height
    );
    const lines = this.cavaleira(this.casa);
    /** essa variável será usada para inverter as coordenadas no eixo Y (no cartesiano, (0,0) fica embaixo enquanto no monitor fica em cima) */
    let maxY = 250;
    console.log(lines);
    for (const line of lines) {
      ctx.beginPath();
      ctx.moveTo(line.start.x + 1, maxY - line.start.y);
      ctx.lineTo(line.end.x + 1, maxY - line.end.y);
      ctx.strokeStyle = '#aa0000';
      ctx.stroke();
    }
  }

  transform(): void {
    console.log(this.mode);
    let t: number[][];
    if (this.mode === 'mode-scale-local') t = this.getLocalScaleMatrix();
    else if (this.mode === 'mode-scale-global') t = this.getGlobalScaleMatrix();
    else if (this.mode === 'mode-translation') t = this.getTranslateMatrix();
    else if (this.mode === 'mode-rotation-origin')
      t = this.getRotationOriginMatrix();
    else if (this.mode === 'mode-rotation-center')
      t = this.getRotationCenterMatrix();
    console.table(t);

    this.casa.lines = this.casa.lines.map((line: Line3D) => {
      const newStart = new Coord3DHomogenea(0, 0, 0, 0);
      const newEnd = new Coord3DHomogenea(0, 0, 0, 0);

      newStart.x =
        line.start.x * t[0][0] +
        line.start.y * t[1][0] +
        line.start.z * t[2][0] +
        t[3][0];
      newStart.y =
        line.start.x * t[0][1] +
        line.start.y * t[1][1] +
        line.start.z * t[2][1] +
        t[3][1];
      newStart.z =
        line.start.x * t[0][2] +
        line.start.y * t[1][2] +
        line.start.z * t[2][2] +
        t[3][2];
      newStart.h =
        line.start.x * t[0][3] +
        line.start.y * t[1][3] +
        line.start.z * t[2][3] +
        t[3][3];

      newEnd.x =
        line.end.x * t[0][0] +
        line.end.y * t[1][0] +
        line.end.z * t[2][0] +
        t[3][0];
      newEnd.y =
        line.end.x * t[0][1] +
        line.end.y * t[1][1] +
        line.end.z * t[2][1] +
        t[3][1];
      newEnd.z =
        line.end.x * t[0][2] +
        line.end.y * t[1][2] +
        line.end.z * t[2][2] +
        t[3][2];
      newEnd.h =
        line.end.x * t[0][3] +
        line.end.y * t[1][3] +
        line.end.z * t[2][3] +
        t[3][3];

      return new Line3D(
        newStart.normalize().toCoord3D(),
        newEnd.normalize().toCoord3D()
      );
    });

    console.log(this.casa);

    this.render();
  }

  getLocalScaleMatrix(): number[][] {
    const t = [
      [this.scaleXYZ[0], 0, 0, 0],
      [0, this.scaleXYZ[1], 0, 0],
      [0, 0, this.scaleXYZ[2], 0],
      [0, 0, 0, 1],
    ];

    return t;
  }

  getGlobalScaleMatrix(): number[][] {
    const t = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, this.scaleGlobal],
    ];

    return t;
  }

  getTranslateMatrix(): number[][] {
    // Vale ressaltar que o valor de Y é negativo porque os cálculos não são pensados para o esquema do navegador
    // onde o y = 0 é no topo
    const t = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [
        this.translationXYZ[0],
        -this.translationXYZ[1],
        this.translationXYZ[2],
        1,
      ],
    ];

    return t;
  }

  getRotationOriginMatrix(): number[][] {
    const t = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];

    const teta = this.rotationDegrees * (Math.PI / 180);
    const cosTeta = Math.cos(teta);
    const sinTeta = Math.sin(teta);

    if (this.rotationAxis === 'x') {
      t[1][1] = cosTeta;
      t[1][2] = -sinTeta;
      t[2][1] = sinTeta;
      t[2][2] = cosTeta;
    } else if (this.rotationAxis === 'y') {
      t[0][0] = cosTeta;
      t[0][2] = sinTeta;
      t[2][0] = -sinTeta;
      t[2][2] = cosTeta;
    } else if (this.rotationAxis === 'z') {
      t[0][0] = cosTeta;
      t[0][1] = -sinTeta;
      t[1][0] = sinTeta;
      t[1][1] = cosTeta;
    }

    return t;
  }

  getRotationCenterMatrix(): number[][] {
    const t = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];

    let minX = this.casa.lines[0].start.x;
    let maxX = 0;
    let minY = this.casa.lines[0].start.y;
    let maxY = 0;
    let minZ = this.casa.lines[0].start.z;
    let maxZ = 0;
    for (const line of this.casa.lines) {
      const mx = Math.max(line.start.x, line.end.x);
      if (mx > maxX) maxX = mx;
      const my = Math.max(line.start.y, line.end.y);
      if (my > maxY) maxY = my;
      const mz = Math.max(line.start.z, line.end.z);
      if (mz > maxZ) maxZ = mz;

      const mix = Math.min(line.start.x, line.end.x);
      if (mix < minX) minX = mix;
      const miy = Math.min(line.start.y, line.end.y);
      if (miy < minY) minY = miy;
      const miz = Math.min(line.start.z, line.end.z);
      if (miz < minZ) minZ = miz;
    }

    const deltaX = maxX - minX;
    const deltaY = maxY - minY;
    const deltaZ = maxZ - minZ;

    const center3D = new Coord3D(deltaX, deltaY, deltaZ);
    t[3][0] = -center3D.x / 2;
    t[3][1] = -center3D.y / 2;
    t[3][2] = -center3D.z / 2;

    const tRotacao = this.getRotationOriginMatrix();

    const tRerversa = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [center3D.x / 2, center3D.y / 2, center3D.z / 2, 1],
    ];

    const tParcial = JSON.parse(JSON.stringify(t));
    console.table(tParcial);

    for (const newSource of [tRotacao, tRerversa]) {
      for (let i = 0; i < tParcial.length; i++) {
        for (let j = 0; j < tParcial[i].length; j++) {
          let newValue = 0;
          for (let k = 0; k < tParcial.length; k++) {
            newValue += tParcial[i][k] * newSource[k][j];
          }
          tParcial[i][j] = newValue;
        }
        //console.log('PUTA MERDA', newValue);
      }
    }

    console.log(tParcial);

    return tParcial;
  }
}
