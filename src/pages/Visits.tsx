import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Visit {
  id: string;
  visit_date: string;
  chief_complaint: string;
  diagnosis: string | null;
  patient: {
    full_name: string;
    phone: string;
  };
}

const Visits = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchVisits = async () => {
      try {
        const { data, error } = await supabase
          .from('visits')
          .select(`
            *,
            patient:patients (
              full_name,
              phone
            )
          `)
          .order('visit_date', { ascending: false })
          .limit(50);

        if (error) throw error;

        setVisits(data as any || []);
      } catch (error: any) {
        toast({
          title: 'خطأ',
          description: 'فشل تحميل قائمة الزيارات',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVisits();
  }, [user, toast]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">الزيارات</h1>
        <p className="text-muted-foreground">سجل الزيارات الطبية</p>
      </div>

      <Card className="medical-card">
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            جاري التحميل...
          </div>
        ) : visits.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            لا توجد زيارات مسجلة
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المريض</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">السبب الرئيسي</TableHead>
                  <TableHead className="text-right">التشخيص</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.map((visit) => (
                  <TableRow key={visit.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{visit.patient.full_name}</p>
                        <p className="text-sm text-muted-foreground" dir="ltr">
                          {visit.patient.phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(visit.visit_date), 'dd MMM yyyy - HH:mm', {
                        locale: ar,
                      })}
                    </TableCell>
                    <TableCell>{visit.chief_complaint}</TableCell>
                    <TableCell>
                      {visit.diagnosis ? (
                        <Badge variant="secondary">{visit.diagnosis}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Visits;
