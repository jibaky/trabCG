/** Classe responsável por representar uma imagem em vetor composta por vértices e arestas */
export class VectorImage {
  lines: Line[];
}

export class VectorImage3D {
  lines: Line3D[];
}

/** Representa uma Linha com ponto de origem e destino */
export class Line {
  start: Coord;
  end: Coord;

  constructor(start: Coord, end: Coord) {
    this.start = start;
    this.end = end;
  }
}

/** Representa uma coordenada no plano */
export class Coord {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

/** Representa uma Linha em 3 dimensões */
export class Line3D extends Line {
  override start: Coord3D;
  override end: Coord3D;

  constructor(start: Coord3D, end: Coord3D) {
    super(start, end);
    this.start = start;
    this.end = end;
  }
}

/** Representa uma coordenada em 3 dimensões (x, y, z) */
export class Coord3D extends Coord {
  z: number;

  constructor(x: number, y: number, z: number) {
    super(x, y);
    this.z = z;
  }
}

export class Coord3DHomogenea extends Coord3D {
  h: number;

  constructor(x: number, y: number, z: number, h: number) {
    super(x, y, z);
    this.h = h;
  }

  normalize(): Coord3DHomogenea {
    if (this.h !== 0) {
      this.x /= this.h;
      this.y /= this.h;
      this.z /= this.h;
      this.h /= this.h;
    }
    return this;
  }

  toCoord3D(): Coord3D {
    return new Coord3D(this.x, this.y, this.z);
  }
}
