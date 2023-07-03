/*jshint esversion: 6 */
/*Pomocné proměnné*/
let blockGenerating = false;
let blockSubmitting = false;
let selectedProduct = null;
//Konfigurator nastavení
var createKonfigurator = {};
//Results
let resultsColumns = [];
let resultsTitles = [];
let resultsUnit = "";
let showEmptyResults = true;
let resultsTitle = "";
let resultsArea = "";
let resultsTooltip = "";
//Náhled
let finalProductURL = null;

//url
const url = "https://petrondrisek.github.io/konfigurator-shoptet/defaultImages";

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
        if(theme[i].type === "options"){
            baseSetting(area, theme[i].settings);
        }
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
          textInput(area, theme[i].inputName, theme[i].title, theme[i].className, theme[i].defaultText, theme[i].placeholder, theme[i].tooltip);
        }
        else if(theme[i].type === "image"){
          fullImageArea(area, theme[i].inputName, theme[i].title, theme[i].className, theme[i].stackDefaultImages, theme[i].tooltip, theme[i].cropRatio);
        }
        else if(theme[i].type === "finalProduct"){
          selectedProduct = dataValues[0];
          finalProductGenerate(area, theme[i].id, theme[i].backgroundImage, theme[i].etiquette, theme[i].items, theme[i].postToURL);
        }
        else if(theme[i].type === "amount"){
            amountInput(area, theme[i].title, theme[i].className, theme[i].tooltip);
        }
        else if(theme[i].type === "results"){
            resultsColumns = theme[i].columns;
            resultsTitles = theme[i].columnAliases;
            resultsUnit = theme[i].unit;
            showEmptyResults = theme[i].showEmptyResults;
            resultsTitle = theme[i].title;
            resultsArea = theme[i].id;
            resultsTooltip = theme[i].tooltip;
            area.append("<div id=\""+resultsArea+"\" class=\"konfiguratorResults\"></div>");
            showResults($("#"+resultsArea), resultsTitle, dataValues[0], false, 0, showEmptyResults);
        }
      }

      //Nastavení ceny
      area.html(area.html() + "<div class=\"konfiguratorChangeable konfiguratorPrice\"><h3>Cena celkem (s DPH): <span id=\"totalPrice\">"+dataValues[0]["cena"] * ($("#amount").length ? $("#amount").val() : 1)+"</span> Kč</h3></div>");

      //Přidání vložit do košíku
      $(area).html($(area).html() + "<button id=\"addToCart\" class=\"orderSubmit btn btn-success\">Vložit do košíku</button>");
}
//Nejzákladnější funkce volaná ze stránky
function Konfigurator(URL, area){
    $.getJSON(URL, function(dataValues){
        /*
            Vzhled našeho konfiguratoru - fce se nenachází zde
        */
        createKonfigurator = dataValues.konfigurator;
        konfiguratorCreate(area, dataValues.data, createKonfigurator);

        //Eventy
        //Vyhledání nového produktu při zmeně jednoho z polí
        $(".konfiguratorData").each(function(){
            $(this).unbind().on('change',function(){
                konfiguratorChange(dataValues.data);
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
        $(".konfiguratorAmount").unbind().on("change", function(){
            //Nastavení ceny
            $("#totalPrice").html(parseInt($("#amount").val())*selectedProduct['cena']);
        });
        $(".konfiguratorAmount").on("input", function(){
            //Nastavení ceny
            if(parseInt($("#amount").val()) < 1) $("#amount").val(1);
            $("#totalPrice").html(parseInt($("#amount").val())*selectedProduct['cena']);
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
        $(".singleSelectItem, .konfiguratorMultipleStackItem, .imageStackItem").each(function(){
            $(this).unbind().click(function(){
                changeValue(this);
            });
        });
        //TextInput font size
        $(".fontPlus").each(function(){
            $(this).unbind().click(function(){
                addFontSize(this);
            });
        });
        $(".fontMinus").each(function(){
            $(this).unbind().click(function(){
                minusFontSize(this);
            });
        });
        //Aktivování range sliderů
        $(".slider").each(function(){
            let values = $(this).attr("data-values");
            $(this).slider({
                min: 0,
                max: 100,
                //value: (100/values)*Math.floor(values/2),
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
        $("#addToCart").click(function(){
            let postURL = createKonfigurator[Object.keys(createKonfigurator).find(key => createKonfigurator[key].type=== "finalProduct")].postToURL;
            if(postURL !== null) submitOrderEvent(postURL);
            else submitOrderAddToCart(selectedProduct["produkt"]);
        });
        $(".konfiguratorModalOpen").each(function(){
            $(this).unbind().click(function(){
                $("#konfiguratorModal").fadeIn(500);
            });
        });
        $(".konfiguratorModalClose").each(function(){
            $(this).unbind().click(function(){
                $("#konfiguratorModal").fadeOut(500);
            });
        });
    });
}

/*Change eventy*/
//Funkce vyhledávání produktu podle konfigurátoru pokud se změní nějaká hodnota
function konfiguratorChange(data, showResultsView = true){
    let values = [], keys = [];
    const body = document.querySelector("body").outerHTML;
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(body, 'text/html');
    let konfiguratorData = $(htmlDoc).find(".konfiguratorData");
    
    for(let i = 0; i < konfiguratorData.length; i++){
        keys.push($(konfiguratorData[i]).attr("id"));
        values.push($(konfiguratorData[i]).attr("value"));
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
            $(".konfigurator__product__content").removeClass("not-existing");
        }else{
            $("#konfiguratorResults").html("<div class=\"resultNull\">Vybraným parametrům neodpovídá žádný produkt</div>");
            $(".konfigurator__product__content").addClass("not-existing");
        }
    } else return product;
}
//Funkce pro zaznamenání změny v selektorech
function changeValue(element){
    //Pokud je multiple, pak nahraju vyber do selectoru
    if($(element).parent().parent().parent().parent().find("[data-selector='"+$(element).attr("data-change")+"']").length){
        if($(element).attr("data-values") !== "undefined"){
            resultsTitles[startsWithInArray(resultsTitles, $("[data-selector='"+$(element).attr("data-change")+"'] .selectorName").text().split(": ")[0])] = $("[data-selector='"+$(element).attr("data-change")+"'] .selectorName").text().split(": ")[0] + ": " + $(element).text();
            $(".konfiguratorProductResults__item__title:contains('"+($("[data-selector='"+$(element).attr("data-change")+"'] .selectorName").text().split(": ")[0])+"')").html("");
            $("[data-selector='"+$(element).attr("data-change")+"'] .selectorName").html($("[data-selector='"+$(element).attr("data-change")+"'] .selectorName").text().split(": ")[0] + ": " + $(element).text());
            $("[data-selector='"+$(element).attr("data-change")+"'] img").attr("src", $(element).find(".optionImage img").attr("src"));
        } else {
            resultsTitles[startsWithInArray(resultsTitles, $("[data-selector='"+$(element).attr("data-change")+"'] .selectorName").text().split(": ")[0])] = $("[data-selector='"+$(element).attr("data-change")+"'] .selectorName").text().split(": ")[0];
            $("[data-selector='"+$(element).attr("data-change")+"'] .selectorName").html($("[data-selector='"+$(element).attr("data-change")+"'] .selectorName").text().split(": ")[0]);
            $("[data-selector='"+$(element).attr("data-change")+"'] img").attr("src", "./add.png");
        }
    }
    
    $(element).parent().parent().attr("data-selected", $(element).attr("data-values"));
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
        finalProductGenerate(area, null, null, createKonfigurator[Object.keys(createKonfigurator).find(key => createKonfigurator[key].type=== "finalProduct")].etiquette, createKonfigurator[Object.keys(createKonfigurator).find(key => createKonfigurator[key].type=== "finalProduct")].items, createKonfigurator[Object.keys(createKonfigurator).find(key => createKonfigurator[key].type=== "finalProduct")].postToURL, true);
    }
    htmlInsert+="</div>";
    htmlInsert+=tooltip(resultsTooltip, true);

    //Nastavení ceny
    $("#totalPrice").html(product["cena"] * ($("#amount").length ? $("#amount").val() : 1));

    if(update === null || update === undefined || update === false) return area.html(area.html() + htmlInsert);
    else return area.html(htmlInsert);
}


/*Selectory*/
//Amount
function amountInput(area, title, className, toolTip = ""){
    let htmlInsert = "<div class=\"konfiguratorAmount konfiguratorChangeable "+className+"\"><h2>"+title+"</h2><input type=\"number\" id=\"amount\" class=\"konfiguratorData konfiguratorPriceData\" min=\"1\" value=\"1\">"+tooltip(toolTip)+"</div>";
    area.html(area.html() + htmlInsert);
}
//Textový selektor
function textInput(area, name, title, className, defaultValue = "", placeholder="", toolTip = ""){
    let htmlInsert = "<div class=\"konfiguratorText "+className+" konfiguratorChangeable\"><h2>"+title+"</h2><div class=\"inputTextarea\"><input type=\"text\" placeholder=\""+placeholder+"\" data-change=\""+name+"\" oninput=\"textInputKeyDown(event, this)\"><input type=\"hidden\" name=\""+name+"\" id=\""+name+"\" value=\""+defaultValue+"\" class=\"konfiguratorData\"><button class=\"fontPlus\" data-textInput=\""+name+"\"><span class=\"small\">zvětšit</span> A<sup>+</sup></button><button class=\"fontMinus\" data-textInput=\""+name+"\"><span class=\"small\">zmenšit</span> A<sup>-</sup></button></div>"+tooltip(toolTip)+"</div>";
    return area.html(area.html() + htmlInsert);
}
function textInputKeyDown(event, element){
    $(element).attr("data-values", $(element).val());
    changeValue(element);
}
function addFontSize(element){
    let findItem = createKonfigurator[Object.keys(createKonfigurator).find(key => createKonfigurator[key].type === "finalProduct")];
    
    createKonfigurator[Object.keys(createKonfigurator).find(key => createKonfigurator[key].type === "finalProduct")].items[Object.keys(findItem.items).find(inputName => findItem.items[inputName].inputName === element.getAttribute("data-textInput"))].fontSize += 5;
    createKonfigurator[Object.keys(createKonfigurator).find(key => createKonfigurator[key].type === "finalProduct")].items[Object.keys(findItem.items).find(inputName => findItem.items[inputName].inputName === element.getAttribute("data-textInput"))].lineHeight += 5;
    $(".konfiguratorData").trigger("change");
}
function minusFontSize(element){
    let findItem = createKonfigurator[Object.keys(createKonfigurator).find(key => createKonfigurator[key].type === "finalProduct")];
    
    createKonfigurator[Object.keys(createKonfigurator).find(key => createKonfigurator[key].type === "finalProduct")].items[Object.keys(findItem.items).find(inputName => findItem.items[inputName].inputName === element.getAttribute("data-textInput"))].fontSize -= 5;
    createKonfigurator[Object.keys(createKonfigurator).find(key => createKonfigurator[key].type === "finalProduct")].items[Object.keys(findItem.items).find(inputName => findItem.items[inputName].inputName === element.getAttribute("data-textInput"))].lineHeight -= 5;
    $(".konfiguratorData").trigger("change");
}
//Multiple selector
function openMultipleSelectStack(element, column){
    $(element).parent().parent().parent().find(".selectedStackItem").removeClass("selectedStackItem");
    $(".konfiguratorMultipleStack[data-column='"+column+"']").addClass("selectedStackItem");
}
function selectFromMultiple(area, data, columns, title, columnTitles, classNameArea, classNamesItems, images = false, itemTitles = [], repeat = false, toolTip=""){
    let values = [], htmlInsert = "<div class=\"konfiguratorMultiple konfiguratorChangeable "+classNameArea+"\">";
    htmlInsert += "<div class=\""+classNameArea+"__area\"><h2>"+title+"</h2>";
    htmlInsert += "<div class=\"konfiguratorMultiple__selectors\">";
    for(let i = 0; i < columns.length; i++){
        htmlInsert+="<div data-selector=\""+columns[i]+"\" class=\""+classNamesItems[i]+"__selector\"><img src=\"add.png\" alt=\"Obrázek\"><span class=\"selectorName\">";
        htmlInsert+=columnTitles[i];
        htmlInsert+="</span><span class=\"removeOption\" data-values=\"undefined\" data-change=\""+columns[i]+"\">Odstranit</a></div>";
    }
    htmlInsert+="</div></div>";

    for(let i = 0; i < columns.length; i++){
        htmlInsert += "<div class=\""+classNamesItems[i]+"__stack konfiguratorMultiple__area\">";
        values[i] = [];
        for(let item of data){
            if(item.produkt !== "0") values[i].push(item[columns[i]]);
        }
        values[i] = selectDistinct(values[i]);

        htmlInsert+="<div data-column=\""+columns[i]+"\" data-repeat=\""+repeat+"\" class=\"konfigurator__konfiguratorMultiple__stack konfiguratorMultipleStack "+(i === 0 ? "selectedStackItem" : "")+"\">";
        for(let j = 0; j < values[i].length; j++){
            htmlInsert+="<div class=\"konfiguratorMultipleStackItem"+(j === 0 ? " selectedItem" : "")+(values[i][j] === "undefined" ? " undefinedItem" : "")+"\" data-values=\""+values[i][j]+"\" data-change=\""+columns[i]+"\">"+(images === true && values[i][j] !== "undefined" ? "<div class=\"optionImage\"><img src=\""+url+"/"+values[i][j]+".png\" alt=\"Obrazek\"></div>": "")+"<p class=\"optionText\">"+(itemTitles === undefined || itemTitles[i] === undefined || itemTitles[i][j] === undefined ? values[i][j] : itemTitles[i][j])+"</p></div>";
        }
        htmlInsert+="</div>";

        htmlInsert += "<input type=\"hidden\" id=\""+columns[i]+"\" class=\"konfiguratorData multipleData\" value=\""+values[i][0]+"\">";
        htmlInsert += "</div>";
    }
    htmlInsert+=tooltip(toolTip);
    htmlInsert += "</div></div>";

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
    let htmlInsert = "<div class=\""+className+" konfiguratorChangeable konfiguratorSingle\" data-selected=\""+values[0]+"\"><h2>"+title+"</h2><div class=\"konfiguratorSingle__area\">";
    for(let i = 0; i < values.length; i++){
        htmlInsert+="<div class=\"singleSelectItem "+className+"__item "+(i == 0 ? "selectedItem" : "")+"\" data-change=\""+column+"\" data-values=\""+values[i]+"\">"+(images === true ? "<div class=\"optionImage\"><img src=\""+url+"/"+values[i]+".png\" alt=\"Obrazek možnosti\"></div>" : "") + "<p class=\"optionText\">"+(itemTitles === undefined || itemTitles[i] === undefined ? values[i] : itemTitles[i])+"</p></div>";
    }
    htmlInsert+="</div><input type=\"hidden\" id=\""+column+"\" class=\"konfiguratorData\" value=\""+values[0]+"\">";
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
    let htmlInsert = "<div class=\"konfiguratorHorizontalRange "+className+" konfiguratorChangeable\"><h2>"+title+"</h2>";
    htmlInsert+=tooltip(toolTip);
    htmlInsert+="<div class=\"konfiguratorDescription\">"+desc+"</div>";
    htmlInsert+="<div class=\" konfiguratorRange\"><div class=\"konfiguratorBackground\" data-background=\""+colors.join(";")+"\" style=\"background: #"+(colors[1] !== undefined ? colors[1] : colors[0])+"\"></div><div data-column=\""+column+"\" class=\""+className+"__slider slider\" data-values=\""+values.length+"\"></div></div>";
    
    htmlInsert+="<input type=\"hidden\" id=\""+column+"\" class=\"konfiguratorData\" value=\""+values[0]+"\">";
    htmlInsert+="</div>";

    area.html(area.html() + htmlInsert);
    return true;
}
//Images
function fullImageArea(area, columnName, title, className, defaultImages = [], toolTip = "", cropRatio = 8/9){
    let upload = uploadImage(className, columnName);
    let stack = selectImage(className, columnName, defaultImages);
    let htmlInsert = "<div class=\"konfiguratorImage konfiguratorChangeable "+className+"\"><h2>"+title+"</h2>";
    htmlInsert+=tooltip(toolTip);
    htmlInsert+=upload;
    htmlInsert+="<i>nebo si vyberte z předem nahraných...</i>";
    htmlInsert+=stack;
    htmlInsert+="</div>";
    htmlInsert+="<button class=\"btn btn-primary editImage konfiguratorModalOpen\" onclick='editImage("+cropRatio+", \""+columnName+"\", \""+className+"\")'>Upravit obrázek</button>"

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
    $("#konfiguratorModal .konfiguratorModal__content__modal-body").html("<img src=\""+$("#"+columnName).val()+"\" alt=\"Obrazek\" id=\"cropImage\"><div class=\"cropRotate\"></div>");
    $("#konfiguratorModal .konfiguratorModal__content__modal-footer").html("<button class=\"btn btn-primary\" id=\"saveCrop\">Uložit úpravu</button>");

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
            $("#konfiguratorModal").fadeOut(500);
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
}

//Tooltip
function tooltip(text, addEvent = false){
    return text.length ? "<div class=\"tooltip-toggle\" "+(addEvent === true ? "onclick=\"$(this).parent().find('.tooltip-toggle-bar').show();\"" : "")+">?</div><div class=\"tooltip-toggle-bar\"><div class=\"tooltip-toggle-bar__content\"><span class=\"close\" "+(addEvent === true ? "onclick=\"$(this).parent().parent().hide();\"" : "")+">&times;</span><p class=\"tooltip-toggle-bar__content__text\">"+text+"<p></div></div>" : "";
}

/*Závěr*/
function finalProductGenerate(area, id, backgroundImage, etiquette, items, urlPost = "", update = false){
    let htmlInsert = "";
    if(update === false){
        if(etiquette){
            htmlInsert += "<div class=\"konfigurator__product--open\">&#8594;</div><div class=\"konfigurator__product\"><div class=\"konfigurator__product--close\">&times;</div><input type=\"hidden\" id=\"finalProduct\" class=\"konfiguratorData\" value=\""+etiquette.image+"\"><div class=\"konfigurator__product__content\"><img src=\""+backgroundImage+"\" class=\"konfigurator__product__background\" alt=\"Produkt\"><img src=\""+etiquette.image+"\" onerror='this.src=\"../defaultImages/loading.gif\"' width=\"266px\" alt=\"Etiketa\" class=\"konfigurator__product__etiquette "+etiquette.className+"\"></div></div>";
            if(blockGenerating === false){
                blockGenerating = true;
                $(".konfigurator__product__content").addClass("loading");
                setTimeout(function(){
                    $(".konfigurator__product__content").removeClass("loading");
                    generateImage(area, selectedProduct, etiquette, items);
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
        if(etiquette){
            if(blockGenerating === false){
                $(".konfigurator__product__content").addClass("loading");
                blockGenerating = true;
                setTimeout(function(){
                    $(".konfigurator__product__content").removeClass("loading");
                    generateImage(area, selectedProduct, etiquette, items);
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

function submitOrderAddToCart(product){
    if(product !== undefined && product !== null && product !== ""){
        if(typeof(shoptet) !== 'undefined') shoptet.cartShared.addToCart({productCode: product, amount: $("#amount").length ? parseInt($("#amount").val()) : 1});
        else {
            console.log("Přidávaný produkt do košíku: "+product);
            alert("Nejste na Shoptetu");
        }
    } else {
        alert("Produkt, který přidávate do košíku neexistuje.");
    }
}

function submitOrderEvent(urlPost){
    let formData = new FormData();
    $(".konfiguratorData").each(function(){
    formData.append($(this).attr("id"), $(this).val());
    });
    formData.append("productCode", selectedProduct["produkt"]);
    formData.append("productPrice", selectedProduct["cena"]);
    
    //Vyřešení obrázku
    if($(".konfigurator__product .konfiguratorData").length){
    let blob = dataURLtoBlob($(".konfigurator__product .konfiguratorData").val());
    formData.append("file", blob, "image.png");
    formData.append("upload_file", true);
    }

    $.ajax({
        type: "POST",
        data: formData,
        contentType: false,
        processData: false,
        url: urlPost,
        success: function(data){
            submitOrderAddToCart(data.productCode);
        },
        error: function(req, error){
            console.error(error);
            blockSubmitting = false;
        }
    });
}


/* Odeslání objednávky do košíku */
//Vytvoři z BLOB obrázku File
function dataURLtoBlob(dataurl) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}


//Generátor náhledu
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
      background.crossOrigin = 'Anonymous';
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
              new Promise(resolve => {
                let customPhoto = new Image();
                customPhoto.crossOrigin = 'Anonymous';
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
                resolve(customPhoto);
                });
          }}
        });
  
          setTimeout(function(){
            if(finalProductURL !== null) URL.revokeObjectURL(finalProductURL);
            canvas.toBlob((blob) => {
              finalProductURL = URL.createObjectURL(blob);
              $(".product__etiketa").attr({"src": finalProductURL, width: etiquette.finalRenderWidth+"px"});
              $("#finalProduct").val(canvas.toDataURL("image/png"));
            });
            ctx.reset();
          }, 1000);
      }
  }