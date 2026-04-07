export interface ParsedSubject {
  id: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  period: number;
  year: number;
  grade: number;
  status: 'APR' | 'RPB' | 'NSP';
  obs: string;
}

export type HistoryFormat = 'standard' | 'webTable';

class HistoryParserService {
  private static instance: HistoryParserService;

  private constructor() {}

  public static getInstance(): HistoryParserService {
    if (!HistoryParserService.instance) {
      HistoryParserService.instance = new HistoryParserService();
    }
    return HistoryParserService.instance;
  }

  //Chequear casos en específico
  private fillGapsOnCode(normalizedCode: string): string {

    if(normalizedCode == 'I110'){   //INTRODUCCION
      return 'IS110'
    }else if(normalizedCode == 'M111'){ //GEOMETRIA
      return 'MM111'
    } else if(normalizedCode == 'E011'){  //ESPAÑOL GENERAL
      return 'EG011'
    } else if(normalizedCode == 'MM21'){  //VECTORES
      return 'MM211'
    } else if(normalizedCode == 'DQ10'){  //DIBUJO 1
      return 'DQ101'
    } else if(normalizedCode == 'SC10'){  //SOCIOLOGIA
      return 'SC101'
    } else if(normalizedCode == 'MMA1'){  //ECUACIONES
      return 'MM411'
    } else if(normalizedCode == 'IS31'){  //CIRCUITOR
      return 'IS311'
    } else if(normalizedCode == 'S11'){   //ELECTRONICA
      return 'IS411'
    } else if(normalizedCode == 'IE11'){   //REDES 2
      return 'IS611'
    } else if(normalizedCode == 'I5820'){   //FINANZAS 
      return 'IS820'
    } else if(normalizedCode == 'IS71'){   //DISEÑO DIGITAL
      return 'IS711'
    } else if(normalizedCode == 'B10'){   //EDUCACION AMBIENTAL
      return 'BI130'
    } else if(normalizedCode == 'I5904'){   //GERENCIA
      return 'IS904'
    } else if(normalizedCode == 'DQJ02'){   //DIBUJO II
      return 'DQ102'
    } else if(normalizedCode == 'IS15'){   //SEMINARIO 
      return 'IS115'
    } else if(normalizedCode == 'RR1S1'){   //PRIMEROS AUXILIOS
      return 'RR181'
    } 

    return normalizedCode;
  }

  /**
   * Parsea el texto extraído del OCR para extraer la tabla de asignaturas
   * @param text Texto extraído del OCR
   * @param format Formato del historial académico ('standard' o 'webTable')
   */
  parseText(text: string, format: HistoryFormat = 'standard'): ParsedSubject[] {
    if (format === 'webTable') {
      return this.parseWebTableFormat(text);
    }
    return this.parseStandardFormat(text);
  }

  private normalizeCode(code: string): string {
    if (!code) return code;
    
    let normalized = code.toUpperCase();
    const originalCode = normalized;
    
    let prefix = '';
    let rest = '';
    
    if (normalized.length >= 2) {
      prefix = normalized.substring(0, 2);
      rest = normalized.substring(2);
      
      // Convertir el primer carácter
      if (prefix.length > 0) {
        const firstChar = prefix[0];
        if (firstChar === '1') {
          prefix = 'I' + prefix.substring(1);
        } else if (firstChar === '8' || firstChar === '9') {
          prefix = 'S' + prefix.substring(1);
        }
      }
      
      // Convertir el segundo carácter
      if (prefix.length > 1) {
        const secondChar = prefix[1];
        if (secondChar === '1') {
          prefix = prefix[0] + 'I';
        } else if (secondChar === '6' || secondChar === '8' || secondChar === '9') {
          prefix = prefix[0] + 'S';
        }
      }
      
      normalized = prefix + rest;
    }
    
    // Convertir últimos tres caracteres (si son letras, convertirlas a números)
    if (normalized.length >= 3) {
      const start = normalized.substring(0, normalized.length - 3);
      let suffix = normalized.substring(normalized.length - 3);
      
      // Convertir cada carácter del sufijo
      let convertedSuffix = '';
      for (let i = 0; i < suffix.length; i++) {
        const char = suffix[i];
        if (char === 'N' || char === 'H' || char === 'T') {
          convertedSuffix += '11';
        } else if (char === 'I') {
          convertedSuffix += '1';
        } else if (char === 'O') {
          convertedSuffix += '0';
        } else {
          convertedSuffix += char;
        }
      }
      
      // Si la conversión generó más caracteres, ajustar
      if (convertedSuffix.length > 3) {
        convertedSuffix = convertedSuffix.slice(-3);
      } else if (convertedSuffix.length < 3) {
        convertedSuffix = convertedSuffix.padStart(3, '0');
      }
      
      normalized = start + convertedSuffix;
    }
    
    return this.fillGapsOnCode(normalized);
  }

  /**
   * Parsea el nuevo formato de tabla web
   * Formato: CODIGO   ASIGNATURA   UV   SECCION   AÑO   PERIODO   CALIFICACION   OBS
   */
  private parseWebTableFormat(text: string): ParsedSubject[] {
    const lines = text.split('\n');
    const subjects: ParsedSubject[] = [];
    
    // Expresiones regulares para limpiar y extraer datos
    // Patrón para líneas con datos (al menos 6 campos separados por espacios múltiples)
    const dataLineRegex = /^([A-Z0-9]+)\s+([A-Z15.ÑÁÉÍÓÚ\s]+?)\s+(\d+\.?\d*)\s+\d+\s+(\d{4})\s+(\d+)\s+(\d+\.?\d*)\s+([A-Z]{3})/i;
    
    // Excepciones con letras en la seccion //REDES II
    const alternativeRegex1 = /([A-Z0-9]+)\s+([A-Z15.ÑÁÉÍÓÚ\s]+?)\s+(\d+\.?\d*)\s+[A-Z0-9]+\s+(\d{4})\s+(\d+)\s+(\d+\.?\d*)\s+([A-Z]{3})/i;

    // Excepciones con letras en la nota //ANALISIS  Y DISEÑO    SEGURIDAD
    const alternativeRegex2 = /([A-Z0-9]+)\s+([A-Z15.ÑÁÉÍÓÚ\s]+?)\s+(\d+\.?\d*)\s+\d+\s+(\d{4})\s+(\d+)\s+(\d+[A-Z])\s+([A-Z]{3})/i;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Saltar líneas vacías o de paginación
      if (!line || line.match(/^\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+$/)) {
        continue;
      }
      
      // Saltar líneas de cabecera
      if (line.match(/CODIGO|ASIGNATURA|UV|SECCION|AÑO|PERIODO|CALIFICACION|OBS/i)) {
        continue;
      }

      
      
      let match = line.match(dataLineRegex);
      if (!match) {
        match = line.match(alternativeRegex1);
        if(!match){
          match = line.match(alternativeRegex2);
        }
      }

      if (match) {
        try {
          let code = match[1].trim();
          let name = match[2].trim();
          
          // Normalizar el código según las reglas
          code = this.normalizeCode(code);
          
          // Limpiar el nombre de espacios extras y caracteres especiales
          name = name.replace(/\s+/g, ' ').trim();
          
          let uv;

          if(match[3].match(/[A-Z]+/i)){   //Si el campo de las unidades valorativas viene con letras
            uv = 4.00
          }else{
            uv = parseFloat(match[3]);
          }

          const year = parseInt(match[4]);
          const period = parseInt(match[5]);
          const grade = parseFloat(match[6]);
          let obs = match[7].toUpperCase();
          
          let status: 'APR' | 'RPB' | 'NSP' = 'APR';
          if (obs === 'RPB' || (grade < 65 && grade > 0)) {
            status = 'RPB';
          } else if (obs === 'NSP' || grade === 0) {
            status = 'NSP';
          } else if (obs === 'APR' || grade >= 65) {
            status = 'APR';
          }
          
          subjects.push({
            id: `${code}-${year}-${period}`,
            subjectCode: code,
            subjectName: name,
            credits: Math.round(uv), 
            period,
            year,
            grade: Math.round(grade),
            status,
            obs,
          });
        } catch (error) {
          console.error('Error parsing web table line:', line, error);
        }
      }
    }
    
    return subjects;
  }

  /**
   * Parsea el formato estándar original impreso
   */
  private parseStandardFormat(text: string): ParsedSubject[] {
    const lines = text.split('\n');
    const subjects: ParsedSubject[] = [];
    let currentYear = 0;
    let inTable = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detectar año (formato: ---- 2022 ---- o similar)
      const yearMatch = line.match(/[-]{2,}\s*(\d{4})\s*[-]{2,}/);
      if (yearMatch) {
        currentYear = parseInt(yearMatch[1]);
        inTable = true;
        continue;
      }

      // Detectar si es una línea de cabecera (CODIGO, NOMBRE, etc.)
      if (line.includes('CODIGO') && line.includes('NOMBRE')) {
        inTable = true;
        continue;
      }

      // Detectar línea de total (para salir de la tabla)
      if (line.includes('Total') && line.includes('Aprobadas')) {
        inTable = false;
        continue;
      }


      if (inTable && line.length > 0 && !line.includes('---') && !line.includes('===')) {
        const subject = this.parseSubjectLine(line, currentYear);
        if (subject) {
          subjects.push(subject);
        }
      }
    }

    return subjects;
  }

  /**
   * Parsea una línea de texto para extraer los datos de una asignatura (formato estándar)
   */
  private parseSubjectLine(line: string, year: number): ParsedSubject | null {
    
    // Limpiar la línea
    let cleanLine = line.replace(/\|/g, '|').trim();
    
    // Dividir por el separador |
    const parts = cleanLine.split('|').map(p => p.trim());
    
    if (parts.length < 5) return null;
    
    try {
      // Extraer código (primer parte)
      let code = parts[0].trim();
      
      // Extraer nombre (segunda parte)
      let name = parts[1].trim();
      // Limpiar nombres que pueden tener texto extra
      name = name.replace(/[^a-zA-ZáéíóúñÑ0-9\s]/g, '');
      
      // Buscar UV (Unidades Valorativas) - puede estar en diferentes posiciones
      let uvIndex = -1;
      let periodIndex = -1;
      let gradeIndex = -1;
      let obsIndex = -1;
      
      for (let i = 2; i < parts.length; i++) {
        const value = parts[i].trim();
        
        // Detectar UV (números pequeños como 3,4,5)
        if (value.match(/^\d+$/) && parseInt(value) <= 10 && uvIndex === -1) {
          uvIndex = i;
        }
        // Detectar período (números 1-12)
        else if (value.match(/^\d+$/) && parseInt(value) <= 12 && periodIndex === -1) {
          periodIndex = i;
        }
        // Detectar nota (números 0-100)
        else if (value.match(/^\d+$/) && parseInt(value) <= 100 && gradeIndex === -1) {
          gradeIndex = i;
        }
        // Detectar observación (APR, RPB, NSP, etc.)
        else if (value.match(/^(APR|RPB|NSP|aprob|repro|no present)/i) && obsIndex === -1) {
          obsIndex = i;
        }
      }
      
      // Si no se encontraron todos los campos, intentar con otra lógica
      if (uvIndex === -1 || periodIndex === -1 || gradeIndex === -1) {
        // Intentar con posiciones fijas según el formato
        if (parts.length >= 6) {
          uvIndex = 2;
          periodIndex = 3;
          gradeIndex = 4;
          obsIndex = 5;
        } else {
          return null;
        }
      }
      
      const uv = parseInt(parts[uvIndex]) || 0;
      const period = parseInt(parts[periodIndex]) || 0;
      const grade = parseInt(parts[gradeIndex]) || 0;
      let obs = obsIndex !== -1 ? parts[obsIndex].toUpperCase() : '';
      
      // Determinar estado según la nota y observación
      let status: 'APR' | 'RPB' | 'NSP' = 'APR';
      if (obs.includes('RPB') || (grade < 65 && grade > 0)) {
        status = 'RPB';
      } else if (obs.includes('NSP') || grade === 0) {
        status = 'NSP';
      } else if (obs.includes('APR') || grade >= 65) {
        status = 'APR';
      }
      
      return {
        id: `${code}-${year}-${period}`,
        subjectCode: code,
        subjectName: name,
        credits : uv,
        period,
        year,
        grade,
        status,
        obs: obs || status,
      };
      
    } catch (error) {
      console.error('Error parsing line:', line, error);
      return null;
    }
  }

  /**
   * Combina múltiples resultados de OCR en una sola lista
   * @param ocrResults Array de textos extraídos
   * @param format Formato del historial académico
   */
  combineResults(ocrResults: string[], format: HistoryFormat = 'webTable'): ParsedSubject[] {
    const allSubjects: ParsedSubject[] = [];
    const seenIds = new Set<string>();
    
    for (const text of ocrResults) {
      const subjects = this.parseText(text, format);
      for (const subject of subjects) {
        if (!seenIds.has(subject.id)) {
          seenIds.add(subject.id);
          allSubjects.push(subject);
        }
      }
    }
    
    // Ordenar por año y período
    return allSubjects.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.period - b.period;
    });
  }
}

export default HistoryParserService.getInstance();