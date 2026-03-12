import { type FormEvent } from "react";

import { Dialog } from "../../components/ui/dialog";

type RenameDialogProps = {
  errorMessage: string | null;
  isPending: boolean;
  label: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTitleChange: (nextTitle: string) => void;
  open: boolean;
  title: string;
  value: string;
};

type ConfirmDeleteDialogProps = {
  errorMessage: string | null;
  isPending: boolean;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
};

type EditCardDialogProps = {
  description: string;
  errorMessage: string | null;
  isPending: boolean;
  onClose: () => void;
  onDescriptionChange: (nextDescription: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTitleChange: (nextTitle: string) => void;
  open: boolean;
  title: string;
};

export const RenameDialog = ({
  errorMessage,
  isPending,
  label,
  onClose,
  onSubmit,
  onTitleChange,
  open,
  title,
  value,
}: RenameDialogProps) => {
  return (
    <Dialog description="Actualiza el texto visible sin salir del tablero." onClose={onClose} open={open} title={title}>
      <form className="board-dialog-form" onSubmit={onSubmit}>
        <label className="field">
          <span className="field-label">Titulo</span>
          <input
            aria-label={label}
            autoComplete="off"
            className="input-field"
            name="rename-title"
            onChange={(event) => onTitleChange(event.target.value)}
            value={value}
          />
        </label>
        {errorMessage === null ? null : (
          <p className="board-feedback board-feedback-error" role="alert">
            {errorMessage}
          </p>
        )}
        <div className="dialog-actions">
          <button className="secondary-button" onClick={onClose} type="button">
            Cancelar
          </button>
          <button className="primary-button" disabled={isPending} type="submit">
            {isPending ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </Dialog>
  );
};

export const ConfirmDeleteDialog = ({
  errorMessage,
  isPending,
  message,
  onClose,
  onConfirm,
  open,
  title,
}: ConfirmDeleteDialogProps) => {
  return (
    <Dialog description={message} onClose={onClose} open={open} title={title}>
      <div className="board-dialog-form">
        <p className="helper-text">Confirma la eliminacion solo si ya no necesitas este elemento.</p>
        {errorMessage === null ? null : (
          <p className="board-feedback board-feedback-error" role="alert">
            {errorMessage}
          </p>
        )}
        <div className="dialog-actions">
          <button className="secondary-button" onClick={onClose} type="button">
            Cancelar
          </button>
          <button className="board-action-button board-action-button-danger" disabled={isPending} onClick={onConfirm} type="button">
            {isPending ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export const EditCardDialog = ({
  description,
  errorMessage,
  isPending,
  onClose,
  onDescriptionChange,
  onSubmit,
  onTitleChange,
  open,
  title,
}: EditCardDialogProps) => {
  return (
    <Dialog description="Actualiza el contenido visible de la tarjeta sin recargar la pagina." onClose={onClose} open={open} title="Editar tarjeta">
      <form className="board-dialog-form" onSubmit={onSubmit}>
        <label className="field">
          <span className="field-label">Titulo</span>
          <input
            aria-label="Titulo de la tarjeta"
            autoComplete="off"
            className="input-field"
            name="card-title"
            onChange={(event) => onTitleChange(event.target.value)}
            value={title}
          />
        </label>
        <label className="field">
          <span className="field-label">Descripcion</span>
          <textarea
            aria-label="Descripcion de la tarjeta"
            autoComplete="off"
            className="textarea-field"
            name="card-description"
            onChange={(event) => onDescriptionChange(event.target.value)}
            rows={5}
            value={description}
          />
        </label>
        {errorMessage === null ? null : (
          <p className="board-feedback board-feedback-error" role="alert">
            {errorMessage}
          </p>
        )}
        <div className="dialog-actions">
          <button className="secondary-button" onClick={onClose} type="button">
            Cancelar
          </button>
          <button className="primary-button" disabled={isPending} type="submit">
            {isPending ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </Dialog>
  );
};
