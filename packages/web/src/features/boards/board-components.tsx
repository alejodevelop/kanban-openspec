import {
  useDroppable,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  useSortable,
  verticalListSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";

import { ActionMenu } from "../../components/ui/action-menu";
import type { BoardCard, BoardColumn, BoardView, CreateCardPayload, CreateColumnPayload } from "./board-api";
import {
  getCardDragData,
  getCardSortableId,
  getColumnDragData,
  getColumnDropData,
  getColumnDropZoneId,
  getColumnSortableId,
} from "./board-reorder";

type BoardColumnComposerProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onCreate: (payload: CreateColumnPayload) => Promise<void>;
  onOpen: () => void;
  resolveErrorMessage: (error: unknown) => string;
};

type BoardCardComposerProps = {
  columnId: string;
  columnTitle: string;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onCreate: (columnId: string, payload: CreateCardPayload) => Promise<void>;
  onOpen: () => void;
  resolveErrorMessage: (error: unknown) => string;
};

type BoardCardItemProps = {
  board: BoardView;
  card: BoardCard;
  cardIndex: number;
  column: BoardColumn;
  columnIndex: number;
  isBusy: boolean;
  isReordering: boolean;
  onDelete: (card: BoardCard) => void;
  onEdit: (card: BoardCard) => void;
  onMoveAcrossColumns: (sourceColumnId: string, cardId: string, direction: -1 | 1) => void;
  onMoveWithinColumn: (columnId: string, cardId: string, direction: -1 | 1) => void;
};

type BoardColumnItemProps = {
  activeComposerColumnId: string | null;
  board: BoardView;
  column: BoardColumn;
  columnIndex: number;
  isCardCreatePending: boolean;
  isColumnBusy: boolean;
  isReordering: boolean;
  onCloseCardComposer: () => void;
  onCreateCard: (columnId: string, payload: CreateCardPayload) => Promise<void>;
  onDeleteCard: (card: BoardCard) => void;
  onDeleteColumn: (column: BoardColumn) => void;
  onEditCard: (card: BoardCard) => void;
  onMoveCardAcrossColumns: (sourceColumnId: string, cardId: string, direction: -1 | 1) => void;
  onMoveCardWithinColumn: (columnId: string, cardId: string, direction: -1 | 1) => void;
  onMoveColumn: (columnId: string, direction: -1 | 1) => void;
  onOpenCardComposer: (columnId: string) => void;
  onRenameColumn: (column: BoardColumn) => void;
  resolveCreateCardErrorMessage: (error: unknown) => string;
};

const BoardDropZone = ({ columnId, children }: { children: ReactNode; columnId: string }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: getColumnDropZoneId(columnId),
    data: getColumnDropData(columnId),
  });

  return (
    <ol className={`card-list ${isOver ? "card-list-over" : ""}`} ref={setNodeRef}>
      {children}
    </ol>
  );
};

export const BoardColumnComposer = ({
  isOpen,
  isSubmitting,
  onClose,
  onCreate,
  onOpen,
  resolveErrorMessage,
}: BoardColumnComposerProps) => {
  const [title, setTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setErrorMessage(null);
    }
  }, [isOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    try {
      await onCreate({ title });
      setTitle("");
      onClose();
    } catch (error) {
      setErrorMessage(resolveErrorMessage(error));
    }
  };

  if (!isOpen) {
    return (
      <button className="primary-button" onClick={onOpen} type="button">
        Nueva columna
      </button>
    );
  }

  return (
    <section className="section-card" aria-labelledby="column-composer-heading">
      <form className="board-inline-form" onSubmit={handleSubmit}>
        <div>
          <p className="board-kicker">Nueva columna</p>
          <h3 id="column-composer-heading">Agrega una columna cuando la necesites.</h3>
        </div>
        <label className="field">
          <span className="field-label">Titulo</span>
          <input
            aria-label="Titulo de la nueva columna"
            autoComplete="off"
            className="input-field"
            name="column-title"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Por ejemplo: In progress…"
            value={title}
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
          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Guardando…" : "Crear columna"}
          </button>
        </div>
      </form>
    </section>
  );
};

const BoardCardComposer = ({
  columnId,
  columnTitle,
  isOpen,
  isSubmitting,
  onClose,
  onCreate,
  onOpen,
  resolveErrorMessage,
}: BoardCardComposerProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setErrorMessage(null);
    }
  }, [isOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    try {
      await onCreate(columnId, { title, description });
      setTitle("");
      setDescription("");
      onClose();
    } catch (error) {
      setErrorMessage(resolveErrorMessage(error));
    }
  };

  return (
    <div className="board-column-footer">
      {!isOpen ? (
        <button className="secondary-button" onClick={onOpen} type="button">
          Agregar tarjeta
        </button>
      ) : (
        <form className="card-composer" onSubmit={handleSubmit}>
          <h4 className="card-composer-title">Nueva tarjeta en {columnTitle}</h4>
          <label className="field">
            <span className="field-label">Titulo</span>
            <input
              aria-label={`Titulo para ${columnTitle}`}
              autoComplete="off"
              className="card-composer-input"
              name={`card-title-${columnId}`}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Escribe el trabajo pendiente…"
              value={title}
            />
          </label>
          <label className="field">
            <span className="field-label">Descripcion</span>
            <textarea
              aria-label={`Descripcion para ${columnTitle}`}
              autoComplete="off"
              className="card-composer-textarea"
              name={`card-description-${columnId}`}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Contexto opcional o siguiente paso…"
              rows={4}
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
            <button className="card-composer-submit" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Guardando…" : "Crear tarjeta"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

const BoardCardItem = ({
  board,
  card,
  cardIndex,
  column,
  columnIndex,
  isBusy,
  isReordering,
  onDelete,
  onEdit,
  onMoveAcrossColumns,
  onMoveWithinColumn,
}: BoardCardItemProps) => {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({
      id: getCardSortableId(card.id),
      data: getCardDragData(column.id, card.id),
    });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      className={`card-item ${isDragging ? "card-item-dragging" : ""} ${isOver ? "card-item-over" : ""}`}
      ref={setNodeRef}
      style={style}
    >
      <div className="card-item-body">
        <div className="card-item-topline">
          <button
            aria-label={`Arrastrar tarjeta ${card.title}`}
            className="drag-handle"
            disabled={isBusy || isReordering}
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            {...listeners}
          >
            Mover
          </button>
          <p className="card-title">{card.title}</p>
        </div>
        {card.description === null ? null : <p className="card-description">{card.description}</p>}
      </div>

      <div className="dashboard-board-actions">
        <span className="board-card-meta">Tarjeta {cardIndex + 1}</span>
        <ActionMenu label={`Acciones para ${card.title}`}>
          <button className="board-action-button" onClick={() => onEdit(card)} role="menuitem" type="button">
            Editar
          </button>
          <button
            className="board-action-button board-action-button-danger"
            onClick={() => onDelete(card)}
            role="menuitem"
            type="button"
          >
            Eliminar
          </button>
          <button
            aria-label={`Subir ${card.title}`}
            className="board-action-button"
            disabled={isBusy || isReordering || cardIndex === 0}
            onClick={() => onMoveWithinColumn(column.id, card.id, -1)}
            role="menuitem"
            type="button"
          >
            Subir
          </button>
          <button
            aria-label={`Bajar ${card.title}`}
            className="board-action-button"
            disabled={isBusy || isReordering || cardIndex === column.cards.length - 1}
            onClick={() => onMoveWithinColumn(column.id, card.id, 1)}
            role="menuitem"
            type="button"
          >
            Bajar
          </button>
          <button
            aria-label={`Mover ${card.title} a ${board.columns[columnIndex - 1]?.title ?? "la columna anterior"}`}
            className="board-action-button"
            disabled={isBusy || isReordering || columnIndex === 0}
            onClick={() => onMoveAcrossColumns(column.id, card.id, -1)}
            role="menuitem"
            type="button"
          >
            A la izquierda
          </button>
          <button
            aria-label={`Mover ${card.title} a ${board.columns[columnIndex + 1]?.title ?? "la columna siguiente"}`}
            className="board-action-button"
            disabled={isBusy || isReordering || columnIndex === board.columns.length - 1}
            onClick={() => onMoveAcrossColumns(column.id, card.id, 1)}
            role="menuitem"
            type="button"
          >
            A la derecha
          </button>
        </ActionMenu>
      </div>
    </li>
  );
};

export const BoardColumnItem = ({
  activeComposerColumnId,
  board,
  column,
  columnIndex,
  isCardCreatePending,
  isColumnBusy,
  isReordering,
  onCloseCardComposer,
  onCreateCard,
  onDeleteCard,
  onDeleteColumn,
  onEditCard,
  onMoveCardAcrossColumns,
  onMoveCardWithinColumn,
  onMoveColumn,
  onOpenCardComposer,
  onRenameColumn,
  resolveCreateCardErrorMessage,
}: BoardColumnItemProps) => {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({
      id: getColumnSortableId(column.id),
      data: getColumnDragData(column.id),
    });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCardComposerOpen = activeComposerColumnId === column.id;
  const cardSortableIds: UniqueIdentifier[] = column.cards.map((card) => getCardSortableId(card.id));

  return (
    <article
      className={`board-column ${isDragging ? "board-column-dragging" : ""} ${isOver ? "board-column-over" : ""}`}
      id={`column-${column.id}`}
      ref={setNodeRef}
      role="listitem"
      style={style}
    >
      <header className="board-column-header">
        <div className="board-column-heading">
          <div className="board-column-title-row">
            <button
              aria-label={`Arrastrar columna ${column.title}`}
              className="drag-handle"
              disabled={isColumnBusy || isCardCreatePending || isReordering}
              ref={setActivatorNodeRef}
              type="button"
              {...attributes}
              {...listeners}
            >
              Mover
            </button>
            <h3>{column.title}</h3>
          </div>
          <span className="board-column-meta">{column.cards.length} tarjetas visibles</span>
        </div>

        <div className="board-column-actions">
          <ActionMenu label={`Acciones para ${column.title}`}>
            <button
              aria-label={`Mover ${column.title} a la izquierda`}
              className="board-action-button"
              disabled={isColumnBusy || isCardCreatePending || isReordering || columnIndex === 0}
              onClick={() => onMoveColumn(column.id, -1)}
              role="menuitem"
              type="button"
            >
              A la izquierda
            </button>
            <button
              aria-label={`Mover ${column.title} a la derecha`}
              className="board-action-button"
              disabled={
                isColumnBusy || isCardCreatePending || isReordering || columnIndex === board.columns.length - 1
              }
              onClick={() => onMoveColumn(column.id, 1)}
              role="menuitem"
              type="button"
            >
              A la derecha
            </button>
            <button
              className="board-action-button"
              disabled={isColumnBusy}
              onClick={() => onRenameColumn(column)}
              role="menuitem"
              type="button"
            >
              Renombrar
            </button>
            <button
              className="board-action-button board-action-button-danger"
              disabled={isColumnBusy}
              onClick={() => onDeleteColumn(column)}
              role="menuitem"
              type="button"
            >
              Eliminar
            </button>
          </ActionMenu>
        </div>
      </header>

      <SortableContext items={cardSortableIds} strategy={verticalListSortingStrategy}>
        <BoardDropZone columnId={column.id}>
          {column.cards.map((card, cardIndex) => (
            <BoardCardItem
              board={board}
              card={card}
              cardIndex={cardIndex}
              column={column}
              columnIndex={columnIndex}
              isBusy={isColumnBusy || isCardCreatePending}
              isReordering={isReordering}
              key={card.id}
              onDelete={onDeleteCard}
              onEdit={onEditCard}
              onMoveAcrossColumns={onMoveCardAcrossColumns}
              onMoveWithinColumn={onMoveCardWithinColumn}
            />
          ))}
        </BoardDropZone>
      </SortableContext>

      {column.cards.length === 0 ? <p className="helper-text">Todavia no hay tarjetas en esta columna.</p> : null}

      <BoardCardComposer
        columnId={column.id}
        columnTitle={column.title}
        isOpen={isCardComposerOpen}
        isSubmitting={isCardCreatePending}
        onClose={onCloseCardComposer}
        onCreate={onCreateCard}
        onOpen={() => onOpenCardComposer(column.id)}
        resolveErrorMessage={resolveCreateCardErrorMessage}
      />
    </article>
  );
};

export const ColumnOverlay = ({ column }: { column: BoardColumn }) => (
  <article className="board-column board-column-overlay">
    <header className="board-column-header">
      <div className="board-column-heading">
        <div className="board-column-title-row">
          <span className="drag-handle drag-handle-static">Mover</span>
          <h3>{column.title}</h3>
        </div>
        <span className="board-column-meta">{column.cards.length} tarjetas visibles</span>
      </div>
    </header>
  </article>
);

export const CardOverlay = ({ card }: { card: BoardCard }) => (
  <div className="card-item card-item-overlay">
    <div className="card-item-body">
      <div className="card-item-topline">
        <span className="drag-handle drag-handle-static">Mover</span>
        <p className="card-title">{card.title}</p>
      </div>
      {card.description === null ? null : <p className="card-description">{card.description}</p>}
    </div>
  </div>
);
