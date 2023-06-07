/*Pomocné proměnné*/
var finalProductURL = null;

function generateImage(area, product, etiquette){
    var background = new Image();
    background.src = etiquette["image"];
    var canvas = null;

    background.onload = function(){
      if(!$("#canvas").length) area.append("<canvas id=\"canvas\" width=\""+background.width+"\" height=\""+background.height+"\" style=\"display:none\"></canvas>")
      canvas = document.getElementById("canvas");
      const ctx = canvas.getContext("2d");

      ctx.drawImage(background,0,0);   
      setTimeout(function(){
        var text, cut, fontSizeText, regex;

        text = $("#customText").val();
        ctx.textAlign="center";
        fontSizeText = etiquette["customTextSize"];
        ctx.font = fontSizeText+'px Briko Rough';
        ctx.fillStyle = "#ffffff";
        cut = Math.round(text.length/(ctx.measureText(text).width/canvas.width))-2;
        regex = new RegExp(".{"+cut+"}", "g");
        text = text.replace(regex, "$&" + "<br>");
        text = text.split("<br>");
        for(let i = 0; i < text.length; i++) ctx.fillText(text[i].toUpperCase(), 400, (515-(fontSizeText*(text.length)/(400/fontSizeText)))+(i*fontSizeText));
        
        
        if(product["resultTitle"] !== undefined){
          text = product["resultTitle"];
          fontSizeText = 35;
          ctx.font = "bold "+fontSizeText+'px Arial';
          text = text.split("<br>");
          for(let i = 0; i < text.length; i++) ctx.fillText(text[i], 600, 810+(i*(fontSizeText+15)));
        }
        
        if(product["resultDesc"] !== undefined){
          text = product["resultDesc"];
          fontSizeText = 25;
          ctx.font = fontSizeText+'px Arial';
          text = text.split("<br>");
          for(let i = 0; i < text.length; i++) ctx.fillText(text[i], 600, 910+(i*(fontSizeText+15)));
        }

        if(product["velikost"] !== undefined){
          text = product["velikost"];
          fontSizeText = 35;
          ctx.font = "bold "+fontSizeText+'px Arial';
          text = text.split("<br>");
          for(let i = 0; i < text.length; i++) ctx.fillText(text[i], 600, 1150+(i*(fontSizeText+15)));
        }

        var customPhoto = new Image();
        customPhoto.src = $("#productImage").val();

        customPhoto.onload = function(){
          var cropTo = 1;
          if(customPhoto.height - 440 > customPhoto.width - 400) cropTo = 440/customPhoto.height;
          else cropTo = 400/customPhoto.width;
          ctx.drawImage(customPhoto, 0+((400-customPhoto.width*cropTo)/2), 777+((400-customPhoto.height*cropTo)/2), customPhoto.width*cropTo, customPhoto.height*cropTo);
        };

        setTimeout(function(){
          if(finalProductURL !== null) URL.revokeObjectURL(finalProductURL);
          canvas.toBlob((blob) => {
            finalProductURL = URL.createObjectURL(blob);
            $(".product__etiketa").attr({"src": finalProductURL, width: "266px"});
            $("#finalProduct").val(canvas.toDataURL("image/png"));
          });
        }, 100);


      }, 50);
    }
  }