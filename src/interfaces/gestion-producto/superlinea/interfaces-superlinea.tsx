export interface Superlinea {
  id: number;
  denominacion: string;
  observacion: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  usuarioCreatedId: number;
  usuarioDeletedId: number;
  usuarioUpdatedId: number;
  sistema: number;
}

export interface SelectSuperlinea {
  id: number;
  denominacion: string;
}

export interface CreateSuperLineaDto {
  denominacion: string;
  observacion?: string | null;
  usuarioCreatedId: number;
}

export interface SuperLineaDto {
  id: number;
  denominacion: string;
  observacion: string | null;
  deletedAt: string | null;
}

export interface SuperLineaListResponseDto {
  data: SuperLineaDto[];
  total: number;
}
