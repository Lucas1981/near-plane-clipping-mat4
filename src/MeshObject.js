export class MeshObject {
  constructor(json) {
    this.points = json.vertices.map((vertex) => ({
      x: vertex.x,
      y: vertex.y,
      z: vertex.z,
    }));

    this.polygons = json.polygons.map((polygon) => ({
      color: polygon.color,
      vertexIndices: [...polygon.vertexIndices],
    }));
  }
}
