export interface ILogin {
  id?: number;
  username: string;
  password: string;
  roles?: any; // puede ser string o array
  nombreColaborador?: string;
  menu?: any; // estructura del menú si aplica
}
