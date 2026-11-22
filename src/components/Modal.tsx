import { ReactNode, useEffect, useRef } from "react";

interface Props {
  ouvert: boolean;
  titre: string;
  onClose: () => void;
  children: ReactNode;
}

// Fenêtre modale basée sur l'élément natif <dialog> :
// Échap ferme la fenêtre, le focus reste à l'intérieur.
export default function Modal({ ouvert, titre, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (ouvert && !d.open) d.showModal();
    if (!ouvert && d.open) d.close();
  }, [ouvert]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // clic sur le fond
      }}
    >
      <div className="modal-tete">
        <h3>{titre}</h3>
        <button type="button" className="lien" onClick={onClose}>
          Fermer
        </button>
      </div>
      <div className="modal-corps">{children}</div>
    </dialog>
  );
}
