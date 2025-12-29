
import * as docx from 'docx';
import { Project, ExportSettings, FloorPlanItem } from '../types';

/**
 * Génère une image PNG du plan au sol avec cadre technique
 */
const generateFloorPlanImage = (items: FloorPlanItem[]): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return "";

  canvas.width = 1200;
  canvas.height = 800;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.strokeStyle = '#f0f0f0';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 50) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 50) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  items.forEach(item => {
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate((item.rotation * Math.PI) / 180);
    
    const color = item.color || '#000000';
    const w = item.width || 80;
    const h = item.height || 80;

    ctx.strokeStyle = color;
    ctx.fillStyle = color + "26";
    ctx.lineWidth = 3;

    if (item.type === 'actor') {
      ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.stroke(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(8, -40); ctx.lineTo(-8, -40); ctx.closePath();
      ctx.fillStyle = color; ctx.fill();
    } else if (item.type === 'camera') {
      ctx.strokeRect(-25, -20, 50, 40);
      ctx.beginPath(); ctx.moveTo(25, 0); ctx.lineTo(50, -30); ctx.lineTo(50, 30); ctx.closePath(); ctx.stroke();
    } else if (item.type === 'light') {
      ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.stroke();
      for(let i=0; i<8; i++) { ctx.rotate(Math.PI/4); ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(30, 0); ctx.stroke(); }
    } else {
      if (item.shape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, w/2, 0, Math.PI*2); ctx.stroke(); ctx.fill(); }
      else { ctx.strokeRect(-w/2, -h/2, w, h); ctx.fillRect(-w/2, -h/2, w, h); }
    }

    if (item.label) {
      ctx.rotate(-(item.rotation * Math.PI) / 180); 
      ctx.fillStyle = "#000000";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.fillText(item.label.toUpperCase(), 0, (h/2) + 25);
    }
    ctx.restore();
  });

  return canvas.toDataURL('image/png');
};

export const generateProductionBook = async (project: Project, settings: ExportSettings) => {
  const { 
    Document, Paragraph, TextRun, AlignmentType, HeadingLevel, 
    Packer, Table, TableRow, TableCell, WidthType, 
    PageOrientation, SectionType, Header, PageNumber,
    VerticalAlign, TableOfContents, ImageRun, BorderStyle
  } = docx;

  const bodySize = settings.fontSize * 2; 
  const internalTitleSize = settings.titleFontSize * 2;
  const projectTitleSize = (settings.fontSize + 4) * 2; 
  const font = settings.fontFamily;
  const titleColor = settings.titleColor.replace('#', '');
  const today = new Date().toLocaleDateString('fr-FR');

  const sections: any[] = [];

  // 1. PAGE DE GARDE AVEC BLOC COORDONNÉES À DROITE (TEXTE À GAUCHE)
  const contactInfo = [
    project.meta.author || "AUTEUR",
    project.meta.address || "",
    project.meta.city || "",
    project.meta.email || "",
    project.meta.phone || "",
    `Version : ${settings.version}`,
    `Date : ${today}`
  ].filter(line => line.trim() !== "");

  sections.push({
    properties: {
      verticalAlign: VerticalAlign.CENTER,
      page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
    },
    children: [
      new Paragraph({
        children: [new TextRun({ text: (project.title || "SANS TITRE").toUpperCase(), bold: true, size: projectTitleSize, font: font })],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [new TextRun({ text: "Écrit par", size: bodySize, font: font })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 240 },
      }),
      new Paragraph({
        children: [new TextRun({ text: (project.meta.author || "Anonyme"), size: bodySize, font: font })],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({ text: "", spacing: { before: 4000 } }),
      
      // Bloc de coordonnées : Table invisible à droite, texte aligné à gauche dedans
      new Table({
        alignment: AlignmentType.RIGHT,
        width: { size: 40, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
          insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
        },
        rows: contactInfo.map((text, idx) => new TableRow({
          children: [
            new TableCell({
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              children: [new Paragraph({
                children: [new TextRun({ text, size: bodySize - 6, font: font, bold: idx === 0, italics: idx === contactInfo.length - 1 })],
                alignment: AlignmentType.LEFT,
              })]
            })
          ]
        }))
      })
    ],
  });

  // 2. SOMMAIRE
  sections.push({
    properties: { type: SectionType.NEXT_PAGE },
    children: [
      new Paragraph({
        text: "TABLE DES MATIÈRES",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.LEFT,
        spacing: { after: 600 }
      }),
      new TableOfContents("Sommaire", {
        hyperlink: true,
        headingStyleRange: "1-1",
      }),
    ],
  });

  // Fixed: explicit any on orientation to avoid literal type narrowing errors
  const createNewSection = (title: string, content: any[], orientation: any = PageOrientation.PORTRAIT) => {
    sections.push({
      properties: { 
        type: SectionType.NEXT_PAGE,
        page: orientation === PageOrientation.LANDSCAPE ? { orientation: PageOrientation.LANDSCAPE, size: { width: 16838, height: 11906 } } : undefined
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ children: [PageNumber.CURRENT], font: font, size: bodySize - 4, bold: true })],
            })
          ]
        })
      },
      children: [
        new Paragraph({ 
          text: title.toUpperCase(), 
          heading: HeadingLevel.HEADING_1, 
          alignment: AlignmentType.LEFT, 
          spacing: { after: 800 } 
        }),
        ...content
      ]
    });
  };

  if (settings.includeIntention) createNewSection("Note d'Intention", [new Paragraph({ children: [new TextRun({ text: project.noteIntention, size: bodySize, font: font })], alignment: AlignmentType.JUSTIFIED, spacing: { line: 360 } })]);
  if (settings.includePitch) createNewSection("Pitch Dramatique", [new Paragraph({ children: [new TextRun({ text: project.pitch, size: bodySize, font: font })], spacing: { line: 360 } })]);
  if (settings.includeSynopsis) createNewSection("Synopsis", [new Paragraph({ children: [new TextRun({ text: project.synopsis, size: bodySize, font: font })], alignment: AlignmentType.JUSTIFIED, spacing: { line: 360 } })]);

  if (settings.includeCharacters && project.characters.length > 0) {
    const chars = project.characters.flatMap(char => [
      new Paragraph({ children: [new TextRun({ text: char.name.toUpperCase(), bold: true, size: bodySize + 2, font: font, color: titleColor })], spacing: { before: 400, after: 120 } }),
      new Paragraph({ children: [new TextRun({ text: char.description, size: bodySize, font: font })], spacing: { after: 300 } })
    ]);
    createNewSection("Personnages", chars);
  }

  // 8. CONTINUITÉ DIALOGUÉE (Standardisation Majuscules/Minuscules)
  if (settings.includeScript && project.script) {
    const scriptElements: any[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(project.script, 'text/html');
    const seenCharacters = new Set<string>();

    Array.from(doc.body.children).forEach(node => {
      const text = node.textContent?.trim() || "";
      if (!text) return;
      
      const className = node.className;
      // Fixed: explicitly type align to avoid literal narrowing to 'left'
      let align: any = AlignmentType.LEFT;
      let isBold = false;
      let isItalic = false;
      let finalText = text;

      if (className.includes('scene-header')) {
        isBold = true;
        finalText = text.toUpperCase();
      } else if (className.includes('character-name')) {
        align = AlignmentType.CENTER;
        const nameKey = text.toUpperCase();
        if (!seenCharacters.has(nameKey)) {
          isBold = true;
          seenCharacters.add(nameKey);
        } else {
          isBold = false;
        }
        finalText = nameKey;
      } else if (className.includes('dialogue')) {
        align = AlignmentType.CENTER;
      } else if (className.includes('parenthetical')) {
        align = AlignmentType.CENTER;
        isItalic = true;
      } else if (className.includes('sound-effect')) {
        align = AlignmentType.CENTER;
        isBold = true;
      }

      scriptElements.push(new Paragraph({
        alignment: align,
        children: [new TextRun({ text: finalText, font: font, size: bodySize, bold: isBold, italics: isItalic })],
        spacing: { before: 180 }
      }));
    });
    createNewSection("Continuité Dialoguée", scriptElements);
  }

  if (settings.includeTechnical && project.technicalBreakdown.length > 0) {
    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            // Fixed: Text content must be wrapped in TextRuns within Paragraph children
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "N°", bold: true, font: font })] })], shading: { fill: "F2F2F2" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ACTION", bold: true, font: font })] })], shading: { fill: "F2F2F2" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "IMAGE", bold: true, font: font })] })], shading: { fill: "F2F2F2" } }),
          ]
        }),
        ...project.technicalBreakdown.map((shot, idx) => new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${idx+1}`, font: font })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: shot.values['action'] || "", font: font })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: shot.values['image'] || "", font: font })] })] }),
          ]
        }))
      ]
    });
    createNewSection("Découpage Technique", [table], PageOrientation.LANDSCAPE);
  }

  if (settings.includeFloorPlan && Object.keys(project.floorPlans).length > 0) {
    Object.entries(project.floorPlans).forEach(([shotId, items], idx) => {
      const shotInfo = project.technicalBreakdown.find(s => s.id === shotId);
      const title = shotInfo ? `PLAN ${project.technicalBreakdown.indexOf(shotInfo) + 1} - ${shotInfo.values['lieu_moment'] || 'Lieu'}` : `Configuration ${idx+1}`;
      
      const imgData = generateFloorPlanImage(items);
      const image = new ImageRun({
        data: imgData.split(',')[1],
        transformation: { width: 660, height: 440 },
        type: 'png'
      });

      // Optimisation de l'espace : Titre + Image uniquement, pas de légende superflue
      createNewSection(`Plan au Sol : ${title}`, [
        new Paragraph({ children: [image], alignment: AlignmentType.CENTER, spacing: { before: 100 } })
      ], PageOrientation.LANDSCAPE);
    });
  }

  const doc = new Document({
    sections,
    styles: { 
      paragraphStyles: [{
        id: HeadingLevel.HEADING_1,
        name: "Heading 1",
        run: { size: internalTitleSize, bold: true, color: titleColor, font: font },
        paragraph: { spacing: { before: 400, after: 600 } },
      }],
      default: { document: { run: { font: font, size: bodySize } } } 
    }
  });

  return await Packer.toBlob(doc);
};
