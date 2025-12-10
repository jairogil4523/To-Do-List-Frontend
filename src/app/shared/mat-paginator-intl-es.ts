import { MatPaginatorIntl } from '@angular/material/paginator';

export function getPaginatorIntlEs(): MatPaginatorIntl {
  const paginatorIntl = new MatPaginatorIntl();
  paginatorIntl.itemsPerPageLabel = 'Filas por página';
  paginatorIntl.nextPageLabel = 'Siguiente página';
  paginatorIntl.previousPageLabel = 'Página anterior';
  paginatorIntl.firstPageLabel = 'Primera página';
  paginatorIntl.lastPageLabel = 'Última página';
  paginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) { return `0 de ${length}`; }
    const startIndex = page * pageSize;
  // Si length < startIndex, no intentar corregir el índice final para evitar valores negativos
    const endIndex = Math.min(startIndex + pageSize, length);
    return `${startIndex + 1} - ${endIndex} de ${length}`;
  };
  return paginatorIntl;
}
