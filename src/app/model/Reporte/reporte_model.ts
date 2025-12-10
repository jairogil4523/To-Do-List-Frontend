export interface IReporte {
id: number;
fechainicio: string;
horainicio: string;
fechafin: string;
horafin: string;
justificacion: string;
colaboradorid: string;
entregable: any;
regionalid: number;
jefeid: string;
tipohoraid: number;
regional: string;
procesoid: number;
tipohora: string;
gestionid: number;
proceso: string;
cantidadHoras: number;
gestion: string;
documento: string;
fechaModificacion: string;
nombreJefe: string;
usuarioAplicativo: string;
nombreColaborador: string;

        // Campos adicionales para el reporte
        
motivoRechazoJefe: string;
estadojefeid: number;
motivoRechazoGh: string;
estadoghid: number;
estadojefe: string;
estadopagoid: number;
estadogh: string;
fechamodificacion: string;
estadopago: string;
tiempoRegistradoid: number;
eliminado: number;
}