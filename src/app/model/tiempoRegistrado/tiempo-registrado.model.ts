export interface ITiempoRegistrado {
  id?: number;
  cantidadHoras: number;
  tipoHora: string;
  fechaHoraInicio: Date;
  fechaHoraFin: Date;
  estadoJefe?: string | null;
  estadoGh?: string | null;
  estadoPago?: string | null;
  nombreColaborador?: string;
  proceso?: string;
  regional?: string;
  jefe?: string;
  evidencia?: string;
  documento: number;
  idColaborador: string;
  eliminado?: number;
  usuarioAplicativo?: string;
  idEstado : number;
  motivoRechazoJefe?: string;
  motivoRechazoGh?: string;
}
