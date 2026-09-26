export interface Presentacion {
  id: number;
  denominacion: string;
  observacion: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  usuarioCreatedId: number;
  usuarioUpdatedId: number;
}

export interface ConsultarPresentacion {
  id: number;
  denominacion: string;
  deletedAt?: string | null;
}

export interface SelectPresentacion {
  id: number;
  denominacion: string;
}
