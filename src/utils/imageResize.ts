/* Reducción de imágenes para guardarlas en localStorage sin agotar la cuota. */

export const PLAYER_PHOTO_MAX_SIZE=320;
/* A partir de este tamaño (caracteres del data URL, ~300 KB) se reduce la foto. */
export const PLAYER_PHOTO_MAX_DATA_URL_LENGTH=300_000;

export function shouldResizePhoto(dataUrl:string|undefined) {
  return Boolean(dataUrl&&dataUrl.length>PLAYER_PHOTO_MAX_DATA_URL_LENGTH);
}

export function readFileAsDataUrl(file:File):Promise<string> {
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();

    reader.onload=()=>typeof reader.result==="string"?resolve(reader.result):reject(new Error("Lectura inválida"));
    reader.onerror=()=>reject(reader.error??new Error("Lectura fallida"));
    reader.readAsDataURL(file);
  });
}

/* Reduce la imagen al tamaño máximo indicado (manteniendo la proporción).
   Usa WebP para conservar la transparencia; los navegadores sin soporte
   devuelven PNG. Si algo falla, devuelve la imagen original. */
export async function resizeImageDataUrl(dataUrl:string,maxSize=PLAYER_PHOTO_MAX_SIZE,quality=.85):Promise<string> {
  try{
    const image=await loadImage(dataUrl);
    const scale=Math.min(1,maxSize/Math.max(image.naturalWidth,image.naturalHeight));

    if(scale>=1&&dataUrl.length<=PLAYER_PHOTO_MAX_DATA_URL_LENGTH)return dataUrl;

    const canvas=document.createElement("canvas");
    canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));
    canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));

    const context=canvas.getContext("2d");
    if(!context)return dataUrl;

    context.drawImage(image,0,0,canvas.width,canvas.height);

    const resized=canvas.toDataURL("image/webp",quality);
    return resized.length<dataUrl.length?resized:dataUrl;
  }catch{
    return dataUrl;
  }
}

function loadImage(src:string):Promise<HTMLImageElement> {
  return new Promise((resolve,reject)=>{
    const image=new Image();

    image.onload=()=>resolve(image);
    image.onerror=()=>reject(new Error("Imagen inválida"));
    image.src=src;
  });
}
