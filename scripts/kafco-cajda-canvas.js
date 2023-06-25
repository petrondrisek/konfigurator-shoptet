/*Pomocné proměnné*/
let finalProductURL = null;

function wrapText(text, ctx, maxWidth){
  let linesStatic = text.split("<br>");
  let lines = [];
  for(let j = 0; j < linesStatic.length; j++){
    let words = linesStatic[j].split(" ");
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        let word = words[i];
        let width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
  }
  return lines;
}

function generateImage(area, product, etiquette, items){
    let background = new Image();
    background.src = etiquette["type"] === "staticImage" ? etiquette["image"] : product[etiquette["image"]];
    let canvas = null;

    background.onload = function(){
      if(!$("#canvas").length) area.append("<canvas id=\"canvas\" width=\""+background.width+"\" height=\""+background.height+"\" style=\"display:none\"></canvas>")
      canvas = document.getElementById("canvas");
      const ctx = canvas.getContext("2d");
      ctx.drawImage(background,0,0);
      setTimeout(function(){
          for(i in items){
            if(items[i].type === "text" || items[i].type === "data"){
                let text = items[i].type === "text" ? $("#"+items[i].inputName).val() : product[items[i].columnName];
                
                ctx.textAlign = items[i].textAlign;
                ctx.font = items[i].fontWeight + " " + items[i].fontSize+"px "+items[i].fontStyle;
                ctx.fillStyle = items[i].fontColor;

                text = wrapText(text, ctx, items[i].width);
                let offset = items[i].adjustPositionLine ? items[i].lineHeight + (text.length * items[i].lineHeight) / 2 : 0;
                for(let j = 0; j < text.length; j++){
                  if(items[i].fontConvert === "uppercase") text[j] = text[j].toUpperCase();
                  else if(items[i].fontConvert === "lowercase") text[j] = text[j].toLowerCase();

                  ctx.fillText(text[j], items[i].left, items[i].top-offset+(j*items[i].lineHeight));
                }
          }
          else if(items[i].type === "image"){
            let item = items[i];
            let customPhoto = new Image();
            customPhoto.src = $("#"+items[i].inputName).val();

            customPhoto.onload = function(){
              let cropTo = 1;
              if(customPhoto.height - item.height > customPhoto.width - item.width) cropTo = item.height/customPhoto.height;
              else cropTo = item.width/customPhoto.width;

              let areaSize = 0;
              if(item.adjustCropTo === "height") areaSize = item.height;
              else areaSize = item.width;
              ctx.beginPath();
              ctx.drawImage(customPhoto, item.left+((areaSize-customPhoto.width*cropTo)/2), item.top+((areaSize-customPhoto.height*cropTo)/2), customPhoto.width*cropTo, customPhoto.height*cropTo);
            };
          }
        }}, 50);

        setTimeout(function(){
          if(finalProductURL !== null) URL.revokeObjectURL(finalProductURL);
          canvas.toBlob((blob) => {
            finalProductURL = URL.createObjectURL(blob);
            $(".product__etiketa").attr({"src": finalProductURL, width: etiquette.finalRenderWidth+"px"});
            $("#finalProduct").val(canvas.toDataURL("image/png"));
          });
          ctx.reset();
        }, 100);
    }
}