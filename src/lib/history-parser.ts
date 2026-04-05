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

  /**
   * Convierte los caracteres del código según las reglas especificadas
   * - Primeros dos caracteres: convertir números a letras
   *   - 1 -> I
   *   - 8 o 9 -> S
   * - Últimos tres dígitos: convertir letras a números
   *   - N, H o T -> 11
   *   - I -> 1
   *   - O -> 0
   */
  private normalizeCode(code: string): string {
    if (!code) return code;
    
    let normalized = code.toUpperCase();
    const originalCode = normalized;

    // Regla especial: Si el primer carácter es 'M' y el código tiene menos de 5 caracteres, duplicar la M
    if (normalized.length > 0 && normalized[0] === 'M' && normalized.length < 5) {
      normalized = 'M' + normalized;
      console.log(`Código duplicado (M inicial): ${originalCode} -> ${normalized}`);
    }
    
    // Convertir primeros dos caracteres (si son números, convertirlos a letras)
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
        // Tomar solo los últimos 3 caracteres si se expandió
        convertedSuffix = convertedSuffix.slice(-3);
      } else if (convertedSuffix.length < 3) {
        // Si se redujo, rellenar con ceros a la izquierda
        convertedSuffix = convertedSuffix.padStart(3, '0');
      }
      
      normalized = start + convertedSuffix;
    }
    
    // Log para depuración
    if (originalCode !== normalized) {
      console.log(`Código normalizado: ${originalCode} -> ${normalized}`);
    }
    
    return normalized;
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
    const dataLineRegex = /^([A-Z0-9]+)\s+([A-Z1.ÑÁÉÍÓÚ\s]+?)\s+(\d+\.?\d*)\s+\d+\s+(\d{4})\s+(\d+)\s+(\d+\.?\d*)\s+([APR]{3})/i;
    
    // También manejar líneas donde los datos están más compactos
    const compactRegex = /([A-Z0-9]+)\s+([A-Z1.ÑÁÉÍÓÚ\s]+?)\s+(\d+\.?\d*)\s+\d+\s+(\d{4})\s+(\d+)\s+(\d+\.?\d*)\s+([APR]{3})/i;
    
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
        match = line.match(compactRegex);
      }
      
      if (match) {
        try {
          let code = match[1].trim();
          let name = match[2].trim();
          
          // Normalizar el código según las reglas
          code = this.normalizeCode(code);
          
          // Limpiar el nombre de espacios extras y caracteres especiales
          name = name.replace(/\s+/g, ' ').trim();
          
          const uv = parseFloat(match[3]);
          const year = parseInt(match[4]);
          const period = parseInt(match[5]);
          const grade = parseFloat(match[6]);
          let obs = match[7].toUpperCase();
          
          // Determinar estado según la observación
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
            credits: Math.round(uv), // Convertir a entero si es necesario
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
    
    // Imprimir la tabla en el formato solicitado
    this.printSubjectTable(subjects);
    
    return subjects;
  }

  /**
   * Imprime la tabla de asignaturas en el formato solicitado
   */
  private printSubjectTable(subjects: ParsedSubject[]): void {
    console.log('\n=== ASIGNATURAS DETECTADAS ===\n');
    
    const formattedSubjects = subjects.map(subject => ({
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName
    }));
    
    console.log(JSON.stringify(formattedSubjects, null, 2));
    
    console.log('\n=== RESUMEN ===');
    console.log(`Total de asignaturas: ${subjects.length}`);
    console.log(`Aprobadas: ${subjects.filter(s => s.status === 'APR').length}`);
    console.log(`Reprobadas: ${subjects.filter(s => s.status === 'RPB').length}`);
    console.log(`No presentadas: ${subjects.filter(s => s.status === 'NSP').length}`);
    console.log('================\n');
  }

  /**
   * Parsea el formato estándar original
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

      // Si estamos en una tabla y la línea tiene formato de datos
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
    // Patrones comunes en el texto OCR
    // Ejemplo: "IS110 | INTROD A LA ING.EN SISTEMAS | 4 | 1 | 100 | APR"
    // o: "MM110 | MATEMATICA | 4 | 1 | 84 | APR"
    
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
  combineResults(ocrResults: string[], format: HistoryFormat = 'standard'): ParsedSubject[] {
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