import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Appointment, Patient } from '@/types';
import { format, isToday, isPast, isFuture } from 'date-fns';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import BookingWizard from '@/pages/public/BookingWizard';
import { toast } from 'sonner';
import { Plus, Calendar as CalendarIcon, Clock, Filter, List, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'today' | 'upcoming' | 'past';

export default function AppointmentsPage() {
  const { dentist } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    loadAppointments();
  }, [dentist]);

  useEffect(() => {
    applyFilter();
  }, [filter, appointments]);

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

  const applyFilter = () => {
    let filtered = [...appointments];

    switch (filter) {
      case 'today':
        filtered = filtered.filter(apt => isToday(new Date(apt.date)));
        break;
      case 'upcoming':
        filtered = filtered.filter(apt => isFuture(new Date(apt.date)));
        break;
      case 'past':
        filtered = filtered.filter(apt => isPast(new Date(apt.date)));
        break;
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.time.localeCompare(b.time);
    });

    setFilteredAppointments(filtered);
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

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!dentist) return;
    
    // Optimistic update - instant UI change
    setAppointments(prev => prev.map(apt => 
      apt.id === id ? { ...apt, status: newStatus as any } : apt
    ));
    setFilteredAppointments(prev => prev.map(apt => 
      apt.id === id ? { ...apt, status: newStatus as any } : apt
    ));
    
    try {
      await api.updateAppointment(id, { status: newStatus as any, dentistId: dentist.id });
      toast.success('Statut mis à jour');
      // Reload to ensure sync
      loadAppointments();
    } catch (error) {
      // Revert on error
      loadAppointments();
      toast.error('Erreur lors de la mise à jour');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rendez-vous</h1>
          <p className="text-gray-600 mt-1">
            Gérez tous vos rendez-vous
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
              <BookingWizard
                onComplete={() => {
                  setShowAddDialog(false);
                  loadAppointments();
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-0">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Tous les rendez-vous</CardTitle>
              <CardDescription>
                {filteredAppointments.length} rendez-vous {filter !== 'all' && `(${filter})`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'rounded-xl',
                    viewMode === 'list' && 'bg-white shadow-sm'
                  )}
                >
                  <List className="h-4 w-4 mr-2" />
                  Liste
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className={cn(
                    'rounded-xl',
                    viewMode === 'calendar' && 'bg-white shadow-sm'
                  )}
                >
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Calendrier
                </Button>
              </div>
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
                <SelectTrigger className="w-[180px] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="upcoming">À venir</SelectItem>
                  <SelectItem value="past">Passés</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'calendar' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar Sidebar */}
              <div className="lg:col-span-1">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-xl border p-4"
                  modifiers={{
                    hasAppointment: filteredAppointments
                      .filter(apt => apt.status !== 'cancelled')
                      .map(apt => {
                        const date = new Date(apt.date);
                        date.setHours(0, 0, 0, 0);
                        return date;
                      }),
                  }}
                  modifiersClassNames={{
                    hasAppointment: 'bg-blue-100 text-blue-700 font-semibold rounded-md',
                  }}
                />
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-blue-100 border-2 border-blue-600"></div>
                    <span>Rendez-vous</span>
                  </div>
                </div>
              </div>

              {/* Appointments for Selected Date */}
              <div className="lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">
                  {selectedDate ? format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr }) : 'Sélectionnez une date'}
                </h3>
                {selectedDate ? (
                  (() => {
                    const dateStr = selectedDate.toISOString().split('T')[0];
                    const dayAppointments = filteredAppointments.filter(apt => {
                      const aptDate = new Date(apt.date).toISOString().split('T')[0];
                      return aptDate === dateStr;
                    }).sort((a, b) => a.time.localeCompare(b.time));

                    return dayAppointments.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        Aucun rendez-vous pour cette date
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {dayAppointments.map((apt) => (
                          <div
                            key={apt.id}
                            className="p-4 border rounded-xl hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Clock className="h-4 w-4" />
                                    <span className="font-medium">{apt.time}</span>
                                  </div>
                                  {getStatusBadge(apt.status)}
                                </div>
                                <div className="font-medium text-gray-900 mb-1">
                                  {patients.find(p => p.id === apt.patientId)?.name || apt.patientId}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {dentist?.services.find(s => s.id === apt.serviceId)?.name || 'N/A'}
                                </div>
                                {apt.notes && (
                                  <div className="text-sm text-gray-500 mt-2">{apt.notes}</div>
                                )}
                              </div>
                              <Select
                                value={apt.status}
                                onValueChange={(v) => handleStatusChange(apt.id, v)}
                              >
                                <SelectTrigger className="w-[140px] rounded-xl">
                                  {getStatusBadge(apt.status)}
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">En attente</SelectItem>
                                  <SelectItem value="confirmed">Confirmé</SelectItem>
                                  <SelectItem value="completed">Terminé</SelectItem>
                                  <SelectItem value="cancelled">Annulé</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Sélectionnez une date pour voir les rendez-vous
                  </div>
                )}
              </div>
            </div>
          ) : (
            isLoading ? (
            <div className="text-center py-8 text-gray-500">Chargement...</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun rendez-vous trouvé
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Heure</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((apt) => (
                    <TableRow key={apt.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {format(new Date(apt.date), 'dd/MM/yyyy', { locale: fr })}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {apt.time}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {patients.find(p => p.id === apt.patientId)?.name || apt.patientId}
                        </div>
                      </TableCell>
                      <TableCell>
                        {dentist?.services.find(s => s.id === apt.serviceId)?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={apt.status}
                          onValueChange={(v) => handleStatusChange(apt.id, v)}
                        >
                          <SelectTrigger className="w-[140px] rounded-xl">
                            {getStatusBadge(apt.status)}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="confirmed">Confirmé</SelectItem>
                            <SelectItem value="completed">Terminé</SelectItem>
                            <SelectItem value="cancelled">Annulé</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {apt.notes || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl"
                        >
                          Modifier
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}

