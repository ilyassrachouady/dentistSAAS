import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Appointment, Patient } from '@/types';
import { format, isToday } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Plus,
} from 'lucide-react';
import NewAppointmentForm from '@/components/NewAppointmentForm';

export default function DashboardHome() {
  const { dentist } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, [dentist]);

  const loadAppointments = async () => {
    if (!dentist) return;
    try {
      const [apptsData, patientsData] = await Promise.all([
        api.getAppointments(dentist.id),
        api.getPatients(dentist.id),
      ]);
      setAppointments(apptsData);
      setPatients(patientsData);
    } catch (error) {
      toast.error('Erreur lors du chargement des rendez-vous');
    } finally {
      setIsLoading(false);
    }
  };

  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return isToday(aptDate) && apt.status !== 'cancelled';
  });

  const stats = {
    today: todayAppointments.length,
    pending: appointments.filter(apt => apt.status === 'pending').length,
    newPatients: new Set(appointments.map(apt => apt.patientId)).size,
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      confirmed: 'default',
      pending: 'secondary',
      completed: 'outline',
      cancelled: 'destructive',
    };
    const labels: Record<string, string> = {
      confirmed: 'Confirmé',
      pending: 'En attente',
      completed: 'Terminé',
      cancelled: 'Annulé',
    };
    return (
      <Badge variant={variants[status] as any} className="rounded-full">
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600 mt-1">
            Bienvenue, {dentist?.name}
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau rendez-vous
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajouter un rendez-vous</DialogTitle>
              <DialogDescription>
                Créez un nouveau rendez-vous pour un patient
              </DialogDescription>
            </DialogHeader>
            <div className="w-full">
              <NewAppointmentForm
                dentistId={dentist?.id || ''}
                onSuccess={() => {
                  setShowAddDialog(false);
                  loadAppointments();
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Rendez-vous aujourd'hui
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.today}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              En attente
            </CardTitle>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Nouveaux patients
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.newPatients}</div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Appointments */}
      <Card className="shadow-sm border-0">
        <CardHeader>
          <CardTitle>Rendez-vous d'aujourd'hui</CardTitle>
          <CardDescription>
            {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Chargement...</div>
          ) : todayAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun rendez-vous prévu aujourd'hui
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Heure</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayAppointments
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell className="font-medium">{apt.time}</TableCell>
                      <TableCell>
                        {patients.find(p => p.id === apt.patientId)?.name || apt.patientId}
                      </TableCell>
                      <TableCell>
                        {dentist?.services.find(s => s.id === apt.serviceId)?.name || 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusBadge(apt.status)}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {apt.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

