// lib/subject-validator.ts
import { Subject } from '../types/academic';
import type { ParsedSubject } from './history-parser';

export interface ValidationResult {
  isValid: boolean;
  validSubjects: ParsedSubject[];
  invalidSubjects: InvalidSubject[];
  warnings: ValidationWarning[];
}

export interface InvalidSubject {
  subject: ParsedSubject;
  reason: 'code_not_found' | 'invalid_credits' | 'invalid_period';
  message: string;
}

export interface ValidationWarning {
  subject: ParsedSubject;
  type: 'duplicate_code' | 'possible_mismatch';
  message: string;
}

class SubjectValidatorService {
  private static instance: SubjectValidatorService;

  private constructor() {}

  public static getInstance(): SubjectValidatorService {
    if (!SubjectValidatorService.instance) {
      SubjectValidatorService.instance = new SubjectValidatorService();
    }
    return SubjectValidatorService.instance;
  }

  /**
   * Valida las asignaturas contra el plan de estudios oficial
   */
  validateSubjects(parsedSubjects: ParsedSubject[], subjects: Subject[]): ValidationResult {

    console.log(parsedSubjects,subjects);
    const validSubjects: ParsedSubject[] = [];
    const invalidSubjects: InvalidSubject[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Crear un mapa de códigos de asignatura del plan para búsqueda rápida
    const planSubjectsMap = new Map();
    subjects.forEach(subject => {
      planSubjectsMap.set(subject.subjectCode, subject);
    });

    // // Detectar códigos duplicados
    // const codeCount = new Map<string, number>();
    // parsedSubjects.forEach(subject => {
    //   const count = codeCount.get(subject.subjectCode) || 0;
    //   codeCount.set(subject.subjectCode, count + 1);
    // });

    parsedSubjects.forEach(subject => {
      const planSubject = planSubjectsMap.get(subject.subjectCode);
      
      // Validar si el código existe en el plan
      if (!planSubject) {
        invalidSubjects.push({
          subject,
          reason: 'code_not_found',
          message: `El código "${subject.subjectCode}" no existe en el plan de estudios`
        });
        return;
      }

      // Validar créditos (UV)
    //   if (subject.credits !== planSubject.credits) {
    //     warnings.push({
    //       subject,
    //       type: 'possible_mismatch',
    //       message: `Las unidades valorativas (${subject.credits}) no coinciden con el plan (${planSubject.credits}) para "${subject.subjectName}"`
    //     });
    //   }

      // Validar período (si está dentro del rango esperado)
    //   if (subject.period < 1 || subject.period > 12) {
    //     invalidSubjects.push({
    //       subject,
    //       reason: 'invalid_period',
    //       message: `El período ${subject.period} no es válido (debe estar entre 1 y 12)`
    //     });
    //     return;
    //   }

      // Detectar códigos duplicados
    //   if (codeCount.get(subject.subjectCode) > 1) {
    //     warnings.push({
    //       subject,
    //       type: 'duplicate_code',
    //       message: `El código "${subject.subjectCode}" aparece múltiples veces en el historial`
    //     });
    //   }

      validSubjects.push(subject);
    });

    return {
      isValid: invalidSubjects.length === 0,
      validSubjects,
      invalidSubjects,
      warnings
    };
  }

  /**
   * Prepara los datos para enviar al backend
   */
  prepareForBackend(subjects: ParsedSubject[]): any[] {
    return subjects.map(subject => ({
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
      credits: subject.credits,
      period: subject.period,
      year: subject.year,
      grade: subject.grade,
      status: subject.status,
      obs: subject.obs
    }));
  }
}

export default SubjectValidatorService.getInstance();