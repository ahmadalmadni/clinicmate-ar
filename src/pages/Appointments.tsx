import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Appointment {
  id: string;
  appointment_date: string;
  purpose: string;
  status: string;
  duration_minutes: number;
  patient: {
    full_name: string;
    phone: string;
  };
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  no_show: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
};

const statusLabels: Record<string, string> = {
  scheduled: 'مجدول',
  confirmed: 'مؤكد',
  completed: 'مكتمل',
  cancelled: 'ملغى',
  no_show: 'لم يحضر',
};

const Appointments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAppointments = async () => {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            patient:patients (
              full_name,
              phone
            )
          `)
          .order('appointment_date', { ascending: true });

        if (error) throw error;

        setAppointments(data as any || []);
      } catch (error: any) {
        toast({
          title: 'خطأ',
          description: 'فشل تحميل قائمة المواعيد',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user, toast]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">المواعيد</h1>
          <p className="text-muted-foreground">إدارة مواعيد المرضى</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          موعد جديد
        </Button>
      </div>

      <Card className="medical-card">
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            جاري التحميل...
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            لا توجد مواعيد مسجلة
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المريض</TableHead>
                  <TableHead className="text-right">التاريخ والوقت</TableHead>
                  <TableHead className="text-right">المدة</TableHead>
                  <TableHead className="text-right">الغرض</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow key={appointment.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{appointment.patient.full_name}</p>
                        <p className="text-sm text-muted-foreground" dir="ltr">
                          {appointment.patient.phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(
                        new Date(appointment.appointment_date),
                        'dd MMM yyyy - HH:mm',
                        { locale: ar }
                      )}
                    </TableCell>
                    <TableCell>{appointment.duration_minutes} دقيقة</TableCell>
                    <TableCell>{appointment.purpose}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[appointment.status]}>
                        {statusLabels[appointment.status]}
                      </Badge>
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

export default Appointments;
