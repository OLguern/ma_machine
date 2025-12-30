import * as docx from 'docx';
import { Project, ExportSettings, FloorPlanItem } from '../types';

const generateFloorPlanImage = (items: FloorPlanItem[]): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return "";
  canvas.width = 1200; canvas.height = 800;
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#f0f0f0'; ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
  for (let y = 0; y < canvas.height; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
  ctx.strokeStyle = '#000000'; ctx.lineWidth = 8; ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
  items.forEach(item => {
    ctx.save(); ctx.translate(item.x, item.y); ctx.rotate((item.rotation * Math.PI) / 180);
    const color = item.color || '#000000'; const w = item.width || 80; const h = item.height || 80;
    ctx.strokeStyle = color; ctx.fillStyle = color + "26"; ctx.lineWidth = 3;
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
      ctx.rotate(-(item.rotation * Math.PI) / 180); ctx.fillStyle = "#000000"; ctx.font = "bold 14px Arial"; ctx.textAlign = "center";
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

  // Page de garde
  sections.push({
    properties: { verticalAlign: VerticalAlign.CENTER },
    children: [
      new Paragraph({
        children: [new TextRun({ text: (project.title || "SANS TITRE").toUpperCase(), bold: true, size: projectTitleSize, font: font })],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [new TextRun({ text: `Auteur : ${project.meta.author || "Non renseigné"}`, size: bodySize, font: font })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 240 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Version : ${settings.version} | ${today}`, size: bodySize - 4, font: font })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 240 },
      })
    ],
  });

  const createNewSection = (title: string, content: any[], orientation: any = PageOrientation.PORTRAIT) => {
    sections.push({
      properties: { 
        type: SectionType.NEXT_PAGE,
        page: orientation === PageOrientation.LANDSCAPE ? { orientation: PageOrientation.LANDSCAPE, size: { width: 16838, height: 11906 } } : undefined
      },
      headers: {
        default: new Header({
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT], font: font, size: bodySize - 4, bold: true })] })]
        })
      },
      children: [
        new Paragraph({ text: title.toUpperCase(), heading: HeadingLevel.HEADING_1, alignment: AlignmentType.LEFT, spacing: { after: 800 } }),
        ...content
      ]
    });
  };

  if (settings.includeIntention) createNewSection("Note d'Intention", [new Paragraph({ children: [new TextRun({ text: project.noteIntention, size: bodySize, font: font })], alignment: AlignmentType.JUSTIFIED })]);
  if (settings.includePitch) createNewSection("Pitch Dramatique", [new Paragraph({ children: [new TextRun({ text: project.pitch, size: bodySize, font: font })] })]);
  if (settings.includeSynopsis) createNewSection("Synopsis", [new Paragraph({ children: [new TextRun({ text: project.synopsis, size: bodySize, font: font })], alignment: AlignmentType.JUSTIFIED })]);

  if (settings.includeCharacters && project.characters.length > 0) {
    createNewSection("Personnages", project.characters.flatMap(char => [
      new Paragraph({ children: [new TextRun({ text: char.name.toUpperCase(), bold: true, size: bodySize + 2, font: font, color: titleColor })], spacing: { before: 400, after: 120 } }),
      new Paragraph({ children: [new TextRun({ text: char.description, size: bodySize, font: font })] })
    ]));
  }

  if (settings.includeScript && project.script) {
    const scriptElements: any[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(project.script, 'text/html');
    Array.from(doc.body.children).forEach(node => {
      const text = node.textContent?.trim() || "";
      if (!text) return;
      const className = node.className;
      let align: any = AlignmentType.LEFT;
      let isBold = false;
      if (className.includes('scene-header')) isBold = true;
      else if (className.includes('character-name')) { align = AlignmentType.CENTER; isBold = true; }
      else if (className.includes('dialogue') || className.includes('parenthetical')) align = AlignmentType.CENTER;
      scriptElements.push(new Paragraph({
        alignment: align,
        children: [new TextRun({ text: text.toUpperCase(), font: font, size: bodySize, bold: isBold })],
        spacing: { before: 180 }
      }));
    });
    createNewSection("Scénario", scriptElements);
  }

  // --- STORYBOARD EXPORT ---
  if (settings.includeStoryboard && project.storyboard && project.storyboard.length > 0) {
    const storyboardContent: any[] = [];
    project.storyboard.forEach((frame, idx) => {
      if (frame.image && frame.image.startsWith('data:image')) {
        storyboardContent.push(new Paragraph({
          children: [new TextRun({ text: `PLAN #${idx + 1} - TYPE : ${frame.shotType}`, bold: true, size: bodySize, font: font, color: "555555" })],
          spacing: { before: 400, after: 200 }
        }));
        
        try {
          const base64Data = frame.image.split(',')[1];
          storyboardContent.push(new Paragraph({
            children: [
              new ImageRun({
                data: base64Data,
                transformation: { width: 520, height: 292 }, // 16:9 ratio
                type: 'png'
              })
            ],
            alignment: AlignmentType.CENTER
          }));
        } catch (e) {
          console.error("Erreur d'inclusion image storyboard:", e);
        }

        if (frame.notes) {
          storyboardContent.push(new Paragraph({
            children: [new TextRun({ text: `Notes : ${frame.notes}`, italics: true, size: bodySize - 2, font: font })],
            spacing: { before: 100, after: 400 }
          }));
        }
      }
    });
    createNewSection("Scénarimage (Storyboard)", storyboardContent);
  }

  if (settings.includeTechnical && project.technicalBreakdown.length > 0) {
    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "N°", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ACTION", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "IMAGE", bold: true })] })] }),
          ]
        }),
        ...project.technicalBreakdown.map((shot, idx) => new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${idx+1}` })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: shot.values['action'] || "" })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: shot.values['image'] || "" })] })] }),
          ]
        }))
      ]
    });
    createNewSection("Découpage Technique", [table], PageOrientation.LANDSCAPE);
  }

  if (settings.includeFloorPlan && Object.keys(project.floorPlans).length > 0) {
    Object.entries(project.floorPlans).forEach(([shotId, items]) => {
      const imgData = generateFloorPlanImage(items);
      const image = new ImageRun({ data: imgData.split(',')[1], transformation: { width: 660, height: 440 }, type: 'png' });
      createNewSection(`Plan au Sol`, [new Paragraph({ children: [image], alignment: AlignmentType.CENTER })], PageOrientation.LANDSCAPE);
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