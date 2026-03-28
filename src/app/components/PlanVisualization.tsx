import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Network } from 'lucide-react';
import type { OfficialPlan } from '@/types/academic';

interface PlanVisualizationProps {
  plan: OfficialPlan;
  onContinue: () => void;
}

export function PlanVisualization({ plan, onContinue }: PlanVisualizationProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodesByPeriod: Record<number, typeof plan.subjects> = {};
    
    // Agrupar por período
    plan.subjects.forEach(subject => {
      if (!nodesByPeriod[subject.idealPeriod]) {
        nodesByPeriod[subject.idealPeriod] = [];
      }
      nodesByPeriod[subject.idealPeriod].push(subject);
    });

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const columnWidth = 300;
    const rowHeight = 100;

    // Crear nodos
    Object.entries(nodesByPeriod).forEach(([period, subjects]) => {
      subjects.forEach((subject, index) => {
        const periodNum = parseInt(period);
        nodes.push({
          id: subject.id,
          type: 'default',
          position: {
            x: periodNum * columnWidth,
            y: index * rowHeight + 50,
          },
          data: {
            label: (
              <div className="text-center">
                <div className="font-mono text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded mb-1">
                  {subject.code}
                </div>
                <div className="text-sm">{subject.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Período {subject.idealPeriod}
                </div>
              </div>
            ),
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          style: {
            background: 'white',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            padding: '10px',
            width: 200,
          },
        });

        // Crear edges para prerrequisitos
        subject.prerequisites.forEach(preqId => {
          edges.push({
            id: `${preqId}-${subject.id}`,
            source: preqId,
            target: subject.id,
            type: 'smoothstep',
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: '#3b82f6',
            },
            style: {
              stroke: '#3b82f6',
              strokeWidth: 2,
            },
          });
        });
      });
    });

    return { nodes, edges };
  }, [plan]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="size-5" />
            Visualización del Plan de Estudios
          </CardTitle>
          <CardDescription>
            Diagrama de flujo mostrando las dependencias entre asignaturas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-2">Información del Plan</h3>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Carrera:</span>
                <span>{plan.careerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de Períodos:</span>
                <span>{plan.totalPeriods}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de Asignaturas:</span>
                <span>{plan.subjects.length}</span>
              </div>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden" style={{ height: '500px' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              fitView
              attributionPosition="bottom-left"
            >
              <Background />
              <Controls />
            </ReactFlow>
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Leyenda:</strong> Las flechas indican las dependencias entre asignaturas. 
              Una materia debe tener aprobados sus prerrequisitos antes de poder cursarla.
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={onContinue} className="w-full" size="lg">
        Continuar al Historial del Estudiante
      </Button>
    </div>
  );
}
