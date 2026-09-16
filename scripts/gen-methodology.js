const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  PageBreak, Header, Footer, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, ShadingType, TableOfContents } = require("docx");
const fs = require("fs");

// Palette
const P = { primary:"101820", body:"182030", secondary:"506070", accent:"5B7FA5", surface:"F0F4F8" };

// Helpers
function h1(text) { return new Paragraph({ heading:HeadingLevel.HEADING_1, spacing:{before:360,after:160}, children:[new TextRun({text,bold:true,size:32,font:{ascii:"Times New Roman",eastAsia:"SimHei"},color:P.primary})] }); }
function h2(text) { return new Paragraph({ heading:HeadingLevel.HEADING_2, spacing:{before:280,after:120}, children:[new TextRun({text,bold:true,size:30,font:{ascii:"Times New Roman",eastAsia:"SimHei"},color:P.primary})] }); }
function h3(text) { return new Paragraph({ heading:HeadingLevel.HEADING_3, spacing:{before:220,after:100}, children:[new TextRun({text,bold:true,size:28,font:{ascii:"Times New Roman",eastAsia:"SimHei"},color:P.primary})] }); }
function p(text,opts) { opts=opts||{}; return new Paragraph({ alignment:AlignmentType.JUSTIFIED, indent:{firstLine:480}, spacing:{line:312,after:80}, children:[new TextRun({text,bold:!!opts.bold,size:24,font:{ascii:"Times New Roman",eastAsia:"SimSun"},color:P.body})] }); }
function bullet(text,lvl) { lvl=lvl||0; return new Paragraph({ alignment:AlignmentType.LEFT, spacing:{line:312,after:60}, indent:{left:480+lvl*360,hanging:240}, children:[new TextRun({text:"\u2022 "+text,size:24,font:{ascii:"Times New Roman",eastAsia:"SimSun"},color:P.body})] }); }

function makeRow(cells,isHeader) {
  return new TableRow({
    tableHeader:!!isHeader, cantSplit:true,
    children: cells.map(function(c,i) {
      return new TableCell({
        width:{size:c.w,type:WidthType.PERCENTAGE},
        shading: isHeader ? {fill:P.accent,type:ShadingType.CLEAR} : (c.sh ? {fill:P.surface,type:ShadingType.CLEAR} : undefined),
        children:[new Paragraph({spacing:{line:280,before:40,after:40},children:[new TextRun({text:c.t,bold:!!isHeader,size:isHeader?22:21,font:{ascii:"Times New Roman",eastAsia:"SimSun"},color:isHeader?"FFFFFF":P.body})]})]
      });
    })
  });
}

function makeTable(hdr,rows,widths) {
  return new Table({
    width:{size:100,type:WidthType.PERCENTAGE},
    rows:[
      makeRow(hdr.map(function(h,i){return {t:h,w:widths[i]};}),true),
    ].concat(rows.map(function(r,ri){
      return makeRow(r.map(function(c,i){return {t:c,w:widths[i],sh:ri%2===1};}),false);
    }))
  });
}

// Build content
var C = [];

// === TOC section (will be section 2) ===
var tocChildren = [];
tocChildren.push(h1("\u0421\u043E\u0434\u0435\u0440\u0436\u0430\u043D\u0438\u0435"));
tocChildren.push(new TableOfContents("TOC",{hyperlink:true,headingStyleRange:"1-3"}));
tocChildren.push(new Paragraph({spacing:{before:120},children:[new TextRun({text:"\u0414\u043B\u044F \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u043D\u043E\u043C\u0435\u0440\u043E\u0432 \u0441\u0442\u0440\u0430\u043D\u0438\u0446 \u043D\u0430\u0436\u043C\u0438\u0442\u0435 \u043F\u0440\u0430\u0432\u043E\u0439 \u043A\u043D\u043E\u043F\u043A\u043E\u0439 \u043D\u0430 \u043E\u0433\u043B\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u2192 \u00AB\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u043F\u043E\u043B\u0435\u00BB",size:20,color:"808080",italics:true,font:{ascii:"Times New Roman",eastAsia:"SimSun"}})]}));
tocChildren.push(new Paragraph({children:[new PageBreak()]}));

// === BODY ===

C.push(h1("\u0412\u0432\u0435\u0434\u0435\u043D\u0438\u0435"));
C.push(p("\u041C\u0435\u0442\u043E\u0434\u043E\u043B\u043E\u0433\u0438\u044F CJ-tracker (\u0442\u0440\u0435\u043A\u0435\u0440 \u043F\u0443\u0442\u0438 \u043A\u043B\u0438\u0435\u043D\u0442\u0430) \u043E\u043F\u0438\u0441\u044B\u0432\u0430\u0435\u0442 \u043F\u043E\u0448\u0430\u0433\u043E\u0432\u044B\u0439 \u043F\u0440\u043E\u0446\u0435\u0441\u0441 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0438\u043D\u0442\u0435\u0440\u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0433\u043E \u043F\u0440\u043E\u0442\u043E\u0442\u0438\u043F\u0430 \u0432\u0438\u0434\u0436\u0435\u0442\u043E\u0432 \u043A\u043E\u043D\u0442\u0430\u043A\u0442-\u0446\u0435\u043D\u0442\u0440\u0430 \u043D\u0430 \u043E\u0441\u043D\u043E\u0432\u0435 \u0430\u043D\u0430\u043B\u0438\u0437\u0430 \u0442\u0440\u0430\u043D\u0441\u043A\u0440\u0438\u043F\u0446\u0438\u0439 \u0440\u0430\u0431\u043E\u0447\u0438\u0445 \u0441\u0435\u0441\u0441\u0438\u0439, \u0441\u043D\u0438\u043C\u043A\u043E\u0432 \u044D\u043A\u0440\u0430\u043D\u0430, \u043E\u043F\u0440\u043E\u0441\u0430 \u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u043E\u0432 \u0438 \u0438\u0442\u0435\u0440\u0430\u0446\u0438\u043E\u043D\u043D\u043E\u0433\u043E \u0443\u0442\u043E\u0447\u043D\u0435\u043D\u0438\u044F. \u041C\u0435\u0442\u043E\u0434\u043E\u043B\u043E\u0433\u0438\u044F \u043F\u043E\u0437\u0432\u043E\u043B\u044F\u0435\u0442 \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u043A\u043$3D\u0446\u0435\u043F\u0442, \u0441\u043E\u043E\u0442\u0432\u0435\u0442C\u0441\u0442\u0432\u0443\u044E\u0449\u0438\u0439 \u044#0440\u0435\u0430\u043B\u044C\u043D\u044B\u043C \u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E\u0441\u0442\u044F\u043C \u043A\u043E\u043C\u0430\u043D\u0434\u044B \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0438."4\u0438 \u043F\u043E\u0442\u0440\u0435\u0431\u043D\u043E\u0441\u0442\u044F\u043C \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439."));
C.push(p("\u0414\u0430\u043D\u043D\u0430\u044F \u043C\u0435\u0442\u043E\u0434\u043E\u043B\u043E/0433\u0438\u044F \u0431\u044B\u043B\u0430 \u043E\u0442\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u0430 \u043D\u0430 \u043F\u0440\u0430\u043A\u0442\u0438\u0447\u0435\u0441\u043A\u043E\u043C \u043F\u0440\u0438\u043C\u0435\u0440\u0435 \u043F\u0440\u043E\u0435\u043A\u0442\u0430 \u0432\u0438\u0434\u0436\u0435\u0442\u043E\u0432 \u043A\u043E\u043D\u0442\u0430\u043A\u0442-\u0446\u0435\u043D\u0442\u0440\u0430 (CC_widget_2026). \u041A\u0430\u0436\u0434\u044B\u0439 \u0448\u0430\u0433 \u043C\u0435\u0442\u043E\u0434\u043E\u043B\u043E\u0433\u0438\u0438 \u043F\u043E\u0434\u043A\u0440\u0435\u043F\u043B\u0451\u043D \u043A\u043E\u043D\u043A\u0440\u0435\u0442\u043D\u044B\u043C\u0438 \u043F\u0440\u0438\u043C\u0435\u0440\u0430\u043C\u0438 \u0438\u0437 \u044D\u0442\u043E\u0433\u043E \u043F\u0440\u043E\u0435\u043A\u0442\u0430, \u0447\u0442\u043E \u0434\u0435\u043B\u0430\u0435\u0442 \u0435\u0451 \u043F\u0440\u0430\u043A\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u043F\u0440\u0438\u043C\u0435\u043D\u0438\u043C\u043E\u0439 \u0438 \u0432\u043E\u0441\u043F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0438\u043C\u043E\u0439."));

console.log("This approach with unicode escapes is too error-prone. Using a Python script instead.");
