/*jshint esversion: 6 */
/*Pomocné proměnné*/
let blockGenerating = false;
let selectedProduct = null;
//Results
let resultsColumns = [];
let resultsTitles = [];
let resultsUnit = "";
let showEmptyResults = true;
let resultsTitle = "";
let resultsArea = "";

/*Pomocné funkce*/
function startsWithInArray(array, find) {
    "use strict";
    for (let i = 0; i < array.length; i++) {
        if(array[i].startsWith(find)) {
            return i;
        }
    }
    return -1;
}
//Funkce pro unikátní výběr
function selectDistinct(array) {
    let includes = [];
    for(let item of array){
        if(!includes.includes(item)) includes.push(item);
    }

    return includes;
}

/*Základ*/
//BaseSetting - skrytí při selected value
function baseSetting(area, settings){
    let htmlInsert = "";
    for(let i of Object.keys(settings)){
        if(i === "SelectedOptionRelationHideOption"){
            htmlInsert+="<style>";
            for(let j of Object.keys(settings[i]))
                for(let k of settings[i][j]) 
                    htmlInsert+="#"+area.attr("id")+":has(> [data-selected='"+j+"']) [data-values='"+k+"']{ display: none }";
            htmlInsert+="</style>";
        }
    }

    area.html(area.html()+htmlInsert);
}
//Z JSONu vytvoří konfigurátor
function konfiguratorCreate(area, dataValues, theme){
    for(let i in theme){
        if(theme[i].type === "rangeHorizontal"){
          rangeFrom(area, dataValues, theme[i].inputName, theme[i].title, theme[i].description, theme[i].className, theme[i].colors, theme[i].tooltip);
        }
        else if(theme[i].type === "select"){
          selectFrom(area, dataValues, theme[i].inputName, theme[i].title, theme[i].className, theme[i].optionImages, theme[i].optionAliases, theme[i].tooltip);
        }
        else if(theme[i].type === "multipleSelect"){
          selectFromMultiple(area, dataValues, theme[i].inputNames, theme[i].title, theme[i].inputTitles, theme[i].className, theme[i].inputClassNames, theme[i].optionImages, theme[i].inputOptionAliases, theme[i].optionRepeat, theme[i].tooltip);
        }
        else if(theme[i].type === "text"){
          textInput(area, theme[i].inputName, theme[i].title, theme[i].className, theme[i].defaultText);
        }
        else if(theme[i].type === "image"){
          fullImageArea(area, theme[i].inputName, theme[i].title, theme[i].className, theme[i].stackDefaultImages, theme[i].tooltip);
        }
        else if(theme[i].type === "finalProduct"){
          selectedProduct = dataValues[0];
          finalProductGenerate(area, theme[i].id, theme[i].backgroundImage, theme[i].etiquette);
        }
        else if(theme[i].type === "amount"){
            amountInput(area, theme[i].title, theme[i].className);
        }
        else if(theme[i].type === "results"){
            resultsColumns = theme[i].columns;
            resultsTitles = theme[i].columnAliases;
            resultsUnit = theme[i].unit;
            showEmptyResults = theme[i].showEmptyResults;
            resultsTitle = theme[i].title;
            resultsArea = theme[i].id;
            area.append("<div id=\""+resultsArea+"\"></div>");
            showResults($("#"+resultsArea), resultsTitle, dataValues[0], false, 0, showEmptyResults);
        }
      }
}
//Nejzákladnější funkce volaná ze stránky
function Konfigurator(csvFileURL, area){
    let request = new XMLHttpRequest();
    request.open('GET', csvFileURL, true);
    request.send(null);
    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
            let type = request.getResponseHeader('Content-Type');
            if (type.indexOf("text") !== 1) {
                //Načtení dat z CSV
                let data = String(request.responseText).split(/\r?\n/);
                //letiable `dataValues`, který nese array všech hodnot
                let dataValues = [];
                let head  = data[0].split(";");
                for(let i = 1; i < data.length; i++){
                    let values = data[i].split(";");
                    dataValues[i-1] = [];
                    for(let j = 0; j < values.length;j++){
                        if(values[j].length) dataValues[i-1][head[j]] = values[j];
                    }
                }

                /*
                    Vzhled našeho konfiguratoru - fce se nenachází zde
                */
                baseSetting(area, settings);
                konfiguratorCreate(area, dataValues, createKonfigurator);

                //Eventy
                //Vyhledání nového produktu při zmeně jednoho z polí
                $(window).ready(function(){
                    $(".konfiguratorData").each(function(){
                        $(this).unbind().on('change',function(){
                            konfiguratorChange(dataValues);
                        });
                    });
                    //Tooltip
                    $(".tooltip-toggle").each(function(){
                        $(this).unbind().click(function(){
                            $(this).parent().find('.tooltip-toggle-bar').show();
                        });
                    });
                    $(".tooltip-toggle-bar .close").each(function(){
                        $(this).unbind().click(function(){
                            $(this).parent().parent().hide();
                        });
                    });
                    //Konfigurator final product view
                    $(".konfigurator__product--open").each(function(){
                        $(this).unbind().click(function(){
                            $(this).parent().find('.konfigurator__product').toggleClass("show");
                        });
                    });
                    $(".konfigurator__product--close").each(function(){
                        $(this).unbind().click(function(){
                            $(this).parent().toggleClass("show");
                        });
                    });
                    //Multiple select open
                    $("[data-selector]").each(function(){
                        $(this).unbind().click(function(){
                            openMultipleSelectStack(this, $(this).attr("data-selector"));
                        });
                    });
                    $(".removeOption").each(function(){
                        $(this).unbind().click(function(){
                            changeValue(this);
                            $('.selectedItem[data-change="'+$(this).attr("data-change")+'"]').removeClass('selectedItem');
                        });
                    });
                    //item select
                    $(".singleSelectItem, .multipleSelectFromStackItem, .imageStackItem").each(function(){
                        $(this).unbind().click(function(){
                            changeValue(this);
                        });
                    });
                    //TextInput font size
                    $(".fontPlus").each(function(){
                        $(this).unbind().click(function(){
                            addFontSize();
                        });
                    });
                    $(".fontMinus").each(function(){
                        $(this).unbind().click(function(){
                            minusFontSize();
                        });
                    });
                    //Aktivování range sliderů
                    $(".slider").each(function(){
                        let values = $(this).attr("data-values");
                        $(this).slider({
                            min: 0,
                            max: 100,
                            orientation: "vertical",
                            step: 100/(values !== undefined ? values-1 : 1),
                            slide: function(event, ui){
                                $(this).find(".ui-slider-handle").attr("data-height", Math.round(ui.value)+"%");
                                $(this).parent().parent().find("#"+$(this).attr("data-column")).val(Math.round(ui.value*((values-1)/100)));
                                let konfiguratorColors = $(this).parent().find("> .konfiguratorBackground").attr("data-background").split(";");
                                $(this).parent().find("> .konfiguratorBackground").css({"height": ui.value+"%", "background": "#"+konfiguratorColors[Math.round(ui.value*((values-1)/100)) % konfiguratorColors.length]});
                                $(this).parent().parent().find("> #"+$(this).attr("data-column")).trigger("change");
                            }
                        });
                    });
                });   
            }
        }
    };
}

/*Change eventy*/
//Funkce vyhledávání produktu podle konfigurátoru pokud se změní nějaká hodnota
function konfiguratorChange(data, showResultsView = true){
    let values = [], keys = [];
    const body = document.querySelector("body").outerHTML;
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(body, 'text/html');
    let konfiguratorData = $(htmlDoc).find(".konfiguratorData");
    
    for(let i of konfiguratorData){
        keys.push($(i).attr("id"));
        values.push($(i).attr("value"));
    }

    let product = -1;
    let isProduct;
    for(let i = 0; i < data.length; i++){
        isProduct = 0;
        for(let j = 0; j < keys.length; j++){
            if(data[i][keys[j]] === values[j] || data[i][keys[j]] === undefined) isProduct++;
        }

        if(isProduct === keys.length){
            product = i;
            break;
        }
    }
    
    if(showResultsView){
        if(product >= 0 && data[product].produkt !== "0"){
            $("#konfigurator").attr("productID", product);
            showResults($("#"+resultsArea), resultsTitle, data[product], true, 0, showEmptyResults);
        }else{
            $("#konfiguratorResults").html("<div class=\"resultNull\">Vybraným parametrům neodpovídá žádný produkt</div>");
        }
    } else return product;
}
//Funkce pro zaznamenání změny v selektorech
function changeValue(element){
    //Pokud je multiple, pak nahraju vyber do selectoru
    if($(element).parent().parent().parent().parent().find("[data-selector='"+$(element).attr("data-change")+"']").length){
        if($(element).attr("data-values") !== "undefined"){
            resultsTitles[startsWithInArray(resultsTitles, $("[data-selector='"+$(element).attr("data-change")+"'] .selectorName").text().split(": ")[0])] = $("[data-selector='"+$(element).attr("data-change")+"'] .selectorName").text().split(": ")[0] + ": " + $(element).text();
            $(".konfiguratorProductResults__item__title:contains('"+($("[data-selector='"+$(element).attr("data-change")+"'] .selectorName").text().split(": ")[0])+"')").html("xx");
            $("[data-selector='"+$(element).attr("data-change")+"'] .selectorName").html($("[data-selector='"+$(element).attr("data-change")+"'] .selectorName").text().split(": ")[0] + ": " + $(element).text());
            $("[data-selector='"+$(element).attr("data-change")+"'] img").attr("src", $(element).find(".optionImage img").attr("src"));
        } else {
            resultsTitles[startsWithInArray(resultsTitles, $("[data-selector='"+$(element).attr("data-change")+"'] .selectorName").text().split(": ")[0])] = $("[data-selector='"+$(element).attr("data-change")+"'] .selectorName").text().split(": ")[0];
            $("[data-selector='"+$(element).attr("data-change")+"'] .selectorName").html($("[data-selector='"+$(element).attr("data-change")+"'] .selectorName").text().split(": ")[0]);
            $("[data-selector='"+$(element).attr("data-change")+"'] img").attr("src", "./add.png");
        }
    }
    
    $(element).parent().attr("data-selected", $(element).attr("data-values"));
    $(element).parent().find(".selectedItem").removeClass("selectedItem");
    $(element).addClass("selectedItem");
    $("#"+$(element).attr("data-change")).val($(element).attr("data-values"));
    $("#"+$(element).attr("data-change")).trigger("change");
}
//Zobrazení výsledků
function showResults(area, title, product, update, defaultValue, showNull = true){
    let htmlInsert = "<h2>"+title+"</h2><div class=\"konfiguratorProductResults\">";
    for(let i = 0; i < resultsColumns.length; i++){
        if(showNull === false && product[resultsColumns[i]] !== '0') htmlInsert += "<div class=\"konfiguratorProductResults__item\"><p class=\"konfiguratorProductResults__item__value\">"+(product[resultsColumns[i]] === undefined ? defaultValue : product[resultsColumns[i]])+" "+resultsUnit+"</p><p class=\"konfiguratorProductResults__item__title\" data-column=\""+resultsColumns[i]+"\">"+(resultsTitles[i] === undefined ? resultsColumns[i] : resultsTitles[i])+"</p></div>";
        else if(showNull === true) htmlInsert += "<div class=\"konfiguratorProductResults__item\"><p class=\"konfiguratorProductResults__item__value\">"+(product[resultsColumns[i]] === undefined ? defaultValue : product[resultsColumns[i]])+" "+resultsUnit+"</p><p class=\"konfiguratorProductResults__item__title\" data-column=\""+resultsColumns[i]+"\">"+(resultsTitles[i] === undefined ? resultsColumns[i] : resultsTitles[i])+"</p></div>";
    
        //Zobrazení výsledků na finální podobě produktu
        selectedProduct = product;
        finalProductGenerate(area, null, null, createKonfigurator[Object.keys(createKonfigurator).find(key => createKonfigurator[key].type=== "finalProduct")].etiquette, true);
    }
    htmlInsert+="</div>";

    

    if(update === null || update === undefined || update === false) return area.html(area.html() + htmlInsert);
    else return area.html(htmlInsert);
}


/*Selectory*/
//Amount
function amountInput(area, title, className){
    let htmlInsert = "<div class=\"konfiguratorAmount konfiguratorChangeable "+className+"\"><h2>"+title+"</h2><input type=\"number\" id=\"amount\" class=\"konfiguratorData\" value=\"1\"></div>";

    area.html(area.html() + htmlInsert);
}
//Textový selektor
function textInput(area, name, title, className, defaultValue = ""){
    let htmlInsert = "<div class=\"konfiguratorText "+className+" konfiguratorChangeable\"><h2>"+title+"</h2><input type=\"text\" data-change=\""+name+"\" onkeydown=\"textInputKeyDown(event, this)\"><input type=\"hidden\" name=\""+name+"\" id=\""+name+"\" value=\""+defaultValue+"\" class=\"konfiguratorData\"><button class=\"fontPlus\" data-textInput=\""+name+"\">+</button><button class=\"fontMinus\" data-textInput=\""+name+"\">-</button></div>";

    return area.html(area.html() + htmlInsert);
}
function textInputKeyDown(event, element){
    let blockedKeyCodes = [8, 9, 13, 16, 17, 18, 20, 27, 33, 34, 35, 36, 45, 46, 91, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 144, 229];
    $(element).attr('data-values', (event.keyCode === 8 ? $(element).val().slice(0, $(element).val().length-1) : $(element).val())+(blockedKeyCodes.includes(event.keyCode) ? '' : event.key));
    changeValue(element);
}
function addFontSize(){
    createKonfigurator[Object.keys(createKonfigurator).find(key => createKonfigurator[key].type === "finalProduct")].etiquette.customTextSize += 5;
    $(".konfiguratorData").trigger("change");
}
function minusFontSize(){
    createKonfigurator[Object.keys(createKonfigurator).find(key => createKonfigurator[key].type === "finalProduct")].etiquette.customTextSize -= 5;
    $(".konfiguratorData").trigger("change");
}
//Multiple selector
function openMultipleSelectStack(element, column){
    $(element).parent().parent().parent().find(".selectedStackItem").removeClass("selectedStackItem");
    $(".multipleSelectFromStack[data-column='"+column+"']").addClass("selectedStackItem");
}
function selectFromMultiple(area, data, columns, title, columnTitles, classNameArea, classNamesItems, images = false, itemTitles = [], repeat = false, toolTip=""){
    let values = [], htmlInsert = "";
    htmlInsert += "<div class=\"multipleSelectFrom "+classNameArea+" konfiguratorChangeable\"><h2>"+title+"</h2>";
    htmlInsert += "<div class=\"multipleSelectFrom__selectors\">";
    for(let i = 0; i < columns.length; i++){
        htmlInsert+="<div data-selector=\""+columns[i]+"\" class=\""+classNamesItems[i]+"__selector\"><img src=\"add.png\" alt=\"Obrázek\"><span class=\"selectorName\">";
        htmlInsert+=columnTitles[i];
        htmlInsert+="</span><span class=\"removeOption\" data-values=\"undefined\" data-change=\""+columns[i]+"\">Odstranit</a></div>";
    }
    htmlInsert+=tooltip(toolTip);
    htmlInsert+="</div></div>";

    for(let i = 0; i < columns.length; i++){
        htmlInsert += "<div class=\""+classNamesItems[i]+"__stack multipleSelectFrom__area\">";
        values[i] = [];
        for(let item of data){
            if(item.produkt !== "0") values[i].push(item[columns[i]]);
        }
        values[i] = selectDistinct(values[i]);

        htmlInsert+="<div data-column=\""+columns[i]+"\" data-repeat=\""+repeat+"\" class=\"konfigurator__multipleSelectFrom__stack multipleSelectFromStack\">";
        for(let j = 0; j < values[i].length; j++){
            htmlInsert+="<div class=\"multipleSelectFromStackItem"+(j === 0 ? " selectedItem" : "")+(values[i][j] === "undefined" ? " undefinedItem" : "")+"\" data-values=\""+values[i][j]+"\" data-change=\""+columns[i]+"\">"+(images === true ? "<div class=\"optionImage\"><img src=\"./"+values[i][j]+".png\" alt=\"Obrazek\"></div>": "")+"<p class=\"optionText\">"+(itemTitles === undefined || itemTitles[i] === undefined || itemTitles[i][j] === undefined ? values[i][j] : itemTitles[i][j])+"</p></div>";
        }
        htmlInsert+="</div>";

        htmlInsert += "<input type=\"hidden\" id=\""+columns[i]+"\" class=\"konfiguratorData multipleData\" value=\""+values[i][0]+"\">";
        htmlInsert += "</div>";
    }
    htmlInsert += "</div>";

    return area.html(area.html() + htmlInsert);
}
//Single selektor
function selectFrom(area, data, column, title, className, images = false, itemTitles = [], toolTip = ""){
    //Vybereme jednotlivé hodnoty
    let values = [];
    for(let item of data){
        if(item.produkt !== "0") values.push(item[column]);
    }
    values = selectDistinct(values);
    
    //Vytvoříme HTML kod
    let htmlInsert = "<div class=\""+className+" konfiguratorChangeable\" data-selected=\""+values[0]+"\"><h2>"+title+"</h2>";
    for(let i = 0; i < values.length; i++){
        htmlInsert+="<div class=\"singleSelectItem "+className+"__item "+(i == 0 ? "selectedItem" : "")+"\" data-change=\""+column+"\" data-values=\""+values[i]+"\">"+(images === true ? "<div class=\"optionImage\"><img src=\""+values[i]+".png\" alt=\"Obrazek možnosti\"></div>" : "") + "<p class=\"optionText\">"+(itemTitles === undefined || itemTitles[i] === undefined ? values[i] : itemTitles[i])+"</p></div>";
    }
    htmlInsert+="<input type=\"hidden\" id=\""+column+"\" class=\"konfiguratorData\" value=\""+values[0]+"\">";
    htmlInsert+=tooltip(toolTip);
    htmlInsert+="</div>";

    return area.html(area.html() + htmlInsert);
}
//RangeHorinzotal selector
function rangeFrom(area, data, column, title, desc, className, colors = ["00f"], toolTip = ""){
    //Vybereme jednotlivé hodnoty
    let values = [];
    for(let item of data){
        if(item.produkt !== "0") values.push(item[column]);
    }
    values = selectDistinct(values);

    //Vytvoříme HTML kod + zapneme slider
    let htmlInsert = "<div class=\""+className+" konfiguratorChangeable\"><h2>"+title+"</h2>";
    htmlInsert+=tooltip(toolTip);
    htmlInsert+="<div class=\"konfiguratorDescription\">"+desc+"</div>";
    htmlInsert+="<div class=\" konfiguratorRange\"><div class=\"konfiguratorBackground\" data-background=\""+colors.join(";")+"\" style=\"background: #"+(colors[1] !== undefined ? colors[1] : colors[0])+"\"></div><div data-column=\""+column+"\" class=\""+className+"__slider slider\" data-values=\""+values.length+"\"></div></div>";
    
    htmlInsert+="<input type=\"hidden\" id=\""+column+"\" class=\"konfiguratorData\" value=\""+values[0]+"\">";
    htmlInsert+="</div>";

    area.html(area.html() + htmlInsert);
    return true;
}
//Images
function fullImageArea(area, columnName, title, className, defaultImages = [], toolTip = ""){
    let upload = uploadImage(className, columnName);
    let stack = selectImage(className, columnName, defaultImages);
    let htmlInsert = "<div class=\"konfiguratorChangeable "+className+"\"><h2>"+title+"</h2>";
    htmlInsert+=tooltip(toolTip);
    htmlInsert+=upload;
    htmlInsert+="<i>nebo si vyberte z předem nahraných...</i>";
    htmlInsert+=stack;
    htmlInsert+="</div>";

    return area.html(area.html() + htmlInsert);
}
function selectImage(className, columnName, defaultImages = []){
    //Vytvoříme HTML kod
    let htmlInsert = "<div class=\""+className+" imageStack konfiguratorChangeable\"><div class=\""+className+"__stack imageStackSelect\">";
    for(let i = 0; i < defaultImages.length; i++){
        htmlInsert+="<div class=\""+className+"__stack__item imageStackItem "+(i==0 ? "selectedItem" : "")+"\" data-change=\""+columnName+"\" data-values=\""+defaultImages[i]+"\"><img src=\""+defaultImages[i]+"\" alt=\"Obrazek\"></div>";
    }
    htmlInsert+="</div><input type=\"hidden\" id=\""+columnName+"\" value=\""+(defaultImages.length > 0 ? defaultImages[0] : "")+"\" class=\"konfiguratorData\">";
    htmlInsert+="</div>";

    return htmlInsert;
}
function uploadImage(addToElement, columnName){
    let htmlInsert = "<div class=\"konfiguratorUploadImage konfiguratorChangeable\">";
    htmlInsert+="<label for=\"upload_"+addToElement+"\" class=\"uploadLabel\">Vložte Váš originální obrázek </label><input type=\"file\" id=\"upload_"+addToElement+"\" onChange=\"addToFileStack('"+addToElement+"', '"+columnName+"', this)\" accept=\"image/*\" style=\"display:none\"></div>";

    return htmlInsert;
}
function addToFileStack(addTo, columnName, file){
    let createURL = URL.createObjectURL(file.files[0]);
    let htmlInsert = "<div class=\""+addTo+"__stack__item imageStackItem\" data-change=\""+columnName+"\" data-values=\""+createURL+"\" onclick=\"changeValue(this)\"><img src=\""+createURL+"\" alt=\"Obrazek\"></div>";
    
    $("."+addTo+"__stack").prepend(htmlInsert);            
    $("[data-values='"+createURL+"']").trigger("click");
    return true;
}
//volaná určitým buttonem - není přímo základem
function editImage(aspectRatio, columnName, fileStack){
    $("#konfiguratorModal .modal-body").html("<img src=\""+$("#"+columnName).val()+"\" alt=\"Obrazek\" id=\"cropImage\"><div class=\"cropRotate\"></div>");
    $("#konfiguratorModal .modal-footer").html("<button class=\"btn btn-primary\" id=\"saveCrop\">Uložit úpravu</button>");

    let cropper = new Cropper(document.querySelector("#cropImage"), {
        aspectRatio: aspectRatio,
        dragMode: 'move',
        minContainerWidth: 350,
        maxContainerWidth: 350,
        minContainerHeight: 350,
        maxContainerHeight: 350,
        responsive:true,
        rotatable: true,
    });

    $("#saveCrop").click(function(){
        cropper.getCroppedCanvas().toBlob((blob) => {
            let createURL = URL.createObjectURL(blob);

            $("."+fileStack+"__stack").prepend("<div class=\""+fileStack+"__stack__item imageStackItem\" data-change=\""+columnName+"\" data-values=\""+createURL+"\" onclick=\"changeValue(this)\"><img src=\""+createURL+"\" alt=\"Obrazek\"></div>");
        
            $("[data-values='"+createURL+"']").trigger("click");
            $("#konfiguratorModal").modal('hide');
        });
        
    });

    $(".cropRotate").slider({
        min: 0,
        max: 360,
        step: 1,
        create: function(){
            $(this).find("span").html(0);
        },
        slide: function(event, ui){
            cropper.rotateTo(ui.value);
        },
        change: function(event, ui){
            $(this).find("span").html(ui.value);
        }
    });

    $("#konfiguratorModal").modal("show");
}

//Tooltip
function tooltip(text){
    return text.length ? "<div class=\"tooltip-toggle\">?</div><div class=\"tooltip-toggle-bar\"><div class=\"tooltip-toggle-bar__content\"><span class=\"close\">&times;</span><p class=\"tooltip-toggle-bar__content__text\">"+text+"<p></div></div>" : "";
}

/*Závěr*/
function finalProductGenerate(area, id, backgroundImage, etiquette, update = false){
    let htmlInsert = "";
    
    if(update === false){
        if(typeof generateImage === "function"){
            htmlInsert += "<div class=\"konfigurator__product--open\">&#8594;</div><div class=\"konfigurator__product\"><div class=\"konfigurator__product--close\">&times;</div><input type=\"hidden\" id=\"finalProduct\" class=\"konfiguratorData\" value=\""+etiquette.image+"\"><div class=\"konfigurator__product__content\"><img src=\""+backgroundImage+"\" class=\"product__background\" alt=\"Produkt\"><img src=\""+etiquette.image+"\" width=\"266px\" alt=\"Etiketa\" class=\""+etiquette.className+"\"></div></div>";
            if(blockGenerating === false){
                blockGenerating = true;
                $(".konfigurator__product__content").addClass("loading");
                setTimeout(function(){
                    $(".konfigurator__product__content").removeClass("loading");
                    generateImage(area, selectedProduct, etiquette);
                    blockGenerating = false;
                }, 3000);
            }
        }
        else{
            htmlInsert+="<table id=\"finalProduct\">";
            $(".konfiguratorData").each(function(){
                htmlInsert+="<tr><td>"+$(this).attr("id")+":</td><td>"+$(this).val()+"</td></tr>";
            });
            htmlInsert+="<tr><td>Kod produktu:</td><td>"+selectedProduct.produkt+"</td></tr>";
            htmlInsert+="</table>";
        } 
        
        return area.html(area.html() + htmlInsert);
    } else {
        if(typeof generateImage === "function"){
            if(blockGenerating === false){
                $(".konfigurator__product__content").addClass("loading");
                blockGenerating = true;
                setTimeout(function(){
                    $(".konfigurator__product__content").removeClass("loading");
                    generateImage(area, selectedProduct, etiquette);
                    blockGenerating = false;
                }, 3000);
            }
        }
        else {
            $(".konfiguratorData").each(function(){
                htmlInsert+="<tr><td>"+$(this).attr("id")+":</td><td>"+$(this).val()+"</td></tr>";
            });
            htmlInsert+="<tr><td>Kod produktu:</td><td>"+selectedProduct.produkt+"</td></tr>";
            $("#finalProduct").html(htmlInsert);
        }
    }
}