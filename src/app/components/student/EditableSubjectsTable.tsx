// components/EditableSubjectsTable.tsx
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Button } from '@/app/components/ui/button';
import { Pencil, Save, X, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { ParsedSubject } from '../../../lib/history-parser';

interface EditableSubjectsTableProps {
  subjects: ParsedSubject[];
  onSubjectsChange: (subjects: ParsedSubject[]) => void;
}

export function EditableSubjectsTable({ subjects, onSubjectsChange }: EditableSubjectsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<ParsedSubject | null>(null);

  const startEdit = (subject: ParsedSubject) => {
    setEditingId(subject.id);
    setEditData({ ...subject });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const saveEdit = () => {
    if (editData) {
      const updatedSubjects = subjects.map(s => 
        s.id === editData.id ? editData : s
      );
      onSubjectsChange(updatedSubjects);
      setEditingId(null);
      setEditData(null);
      toast.success('Asignatura actualizada');
    }
  };

  const deleteSubject = (id: string) => {
    const updatedSubjects = subjects.filter(s => s.id !== id);
    onSubjectsChange(updatedSubjects);
    toast.success('Asignatura eliminada');
  };

  const addNewSubject = () => {
    const newId = `new-${Date.now()}`;
    const newSubject: ParsedSubject = {
      id: newId,
      code: '',
      name: '',
      uv: 0,
      period: 1,
      year: new Date().getFullYear(),
      grade: 0,
      status: 'APR',
      obs: 'APR',
    };
    onSubjectsChange([...subjects, newSubject]);
    startEdit(newSubject);
  };

  const renderEditableCell = (
    field: keyof ParsedSubject,
    value: string | number,
    type: 'text' | 'number' | 'select'
  ) => {
    if (editingId !== editData?.id) {
      if (field === 'grade' && typeof value === 'number') {
        return `${value}%`;
      }
      if (field === 'uv' && typeof value === 'number') {
        return value;
      }
      if (field === 'status') {
        const statusMap = {
          APR: 'APR',
          RPB: 'RPB',
          NSP: 'NSP',
        };
        return statusMap[value as keyof typeof statusMap] || value;
      }
      return value;
    }

    if (type === 'text') {
      return (
        <Input
          value={editData[field] as string}
          onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
          className="w-full"
        />
      );
    }

    if (type === 'number') {
      return (
        <Input
          type="number"
          value={editData[field] as number}
          onChange={(e) => setEditData({ ...editData, [field]: parseInt(e.target.value) || 0 })}
          className="w-full"
        />
      );
    }

    if (type === 'select') {
      return (
        <Select
          value={editData[field] as string}
          onValueChange={(value) => setEditData({ ...editData, [field]: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="APR">APR (Aprobado)</SelectItem>
            <SelectItem value="RPB">RPB (Reprobado)</SelectItem>
            <SelectItem value="NSP">NSP (No Presentó)</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Asignaturas Detectadas ({subjects.length})
        </h3>
        <Button onClick={addNewSubject} size="sm" variant="outline">
          <Plus className="size-4 mr-2" />
          Agregar Manualmente
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Código</TableHead>
              <TableHead className="min-w-[200px]">Nombre</TableHead>
              <TableHead className="w-[70px]">UV</TableHead>
              <TableHead className="w-[70px]">Período</TableHead>
              <TableHead className="w-[80px]">Año</TableHead>
              <TableHead className="w-[80px]">Nota</TableHead>
              <TableHead className="w-[100px]">Estado</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.map((subject) => (
              <TableRow key={subject.id}>
                <TableCell>
                  {renderEditableCell('code', subject.code, 'text')}
                </TableCell>
                <TableCell>
                  {renderEditableCell('name', subject.name, 'text')}
                </TableCell>
                <TableCell className="text-center">
                  {renderEditableCell('uv', subject.uv, 'number')}
                </TableCell>
                <TableCell className="text-center">
                  {renderEditableCell('period', subject.period, 'number')}
                </TableCell>
                <TableCell className="text-center">
                  {renderEditableCell('year', subject.year, 'number')}
                </TableCell>
                <TableCell className="text-center">
                  {renderEditableCell('grade', subject.grade, 'number')}
                </TableCell>
                <TableCell className="text-center">
                  {renderEditableCell('status', subject.status, 'select')}
                </TableCell>
                <TableCell>
                  {editingId === subject.id ? (
                    <div className="flex gap-1">
                      <Button onClick={saveEdit} size="sm" variant="ghost">
                        <Save className="size-4 text-green-500" />
                      </Button>
                      <Button onClick={cancelEdit} size="sm" variant="ghost">
                        <X className="size-4 text-red-500" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <Button onClick={() => startEdit(subject)} size="sm" variant="ghost">
                        <Pencil className="size-4" />
                      </Button>
                      <Button onClick={() => deleteSubject(subject.id)} size="sm" variant="ghost">
                        <Trash2 className="size-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {subjects.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No se detectaron asignaturas. Puedes agregarlas manualmente.
        </div>
      )}

      {/* Resumen */}
      {subjects.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="font-medium mb-2">Resumen Académico</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Asignaturas</p>
              <p className="text-2xl font-bold">{subjects.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Aprobadas</p>
              <p className="text-2xl font-bold text-green-600">
                {subjects.filter(s => s.status === 'APR').length}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Reprobadas</p>
              <p className="text-2xl font-bold text-red-600">
                {subjects.filter(s => s.status === 'RPB').length}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Total UV</p>
              <p className="text-2xl font-bold">
                {subjects.reduce((sum, s) => sum + s.uv, 0)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}