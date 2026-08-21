import {useRef} from "react";

interface PlayerPhotoUploadProps {
  photo?: string;
  nickname: string;
  onChange: (photo: string) => void;
}

export function PlayerPhotoUpload({photo,nickname,onChange}: PlayerPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };

    reader.readAsDataURL(file);
  };

  return (
    <>
      <button className="season-player-card__photo" type="button" onClick={() => inputRef.current?.click()} aria-label="Cambiar foto del jugador">
        {photo ? <img src={photo} alt={nickname} /> : <div className="season-player-card__photo-placeholder"><div className="season-player-card__photo-head" /><div className="season-player-card__photo-body" /><span>SUBIR FOTO</span></div>}
      </button>

      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => handleFile(event.target.files?.[0])} />
    </>
  );
}