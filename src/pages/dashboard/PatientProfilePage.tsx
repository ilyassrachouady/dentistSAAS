import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Patient, Appointment } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  FileText,
  Edit,
  Save,
  X,
} from 'lucide-react';

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { dentist } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Patient>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPatient();
  }, [id, dentist]);

  const loadPatient = async () => {
    if (!id || !dentist) return;
    try {
      const data = await api.getPatient(id, dentist.id);
      if (data) {
        setPatient(data);
        setFormData(data);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement du patient');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id || !dentist) return;
    setIsSaving(true);
    try {
      await api.updatePatient(id, formData, dentist.id);
      toast.success('Patient mis à jour');
      setIsEditing(false);
      loadPatient();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-gray-500 mb-4">Patient non trouvé</div>
        <Button onClick={() => navigate('/dashboard/patients')} className="rounded-xl">
          Retour à la liste
        </Button>
      </div>
    );
  }

  const upcomingAppointments = patient.appointments
    .filter(apt => new Date(apt.date) >= new Date() && apt.status !== 'cancelled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastAppointments = patient.appointments
    .filter(apt => new Date(apt.date) < new Date() || apt.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard/patients')}
          className="rounded-xl"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profil du patient</h1>
          <p className="text-gray-600 mt-1">
            Informations et historique des rendez-vous
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Info Card */}
        <Card className="lg:col-span-1 shadow-sm border-0">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage />
                <AvatarFallback className="text-xl">
                  {patient.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{patient.name}</CardTitle>
                <CardDescription>Patient</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{patient.phone}</span>
              </div>
              {patient.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{patient.email}</span>
                </div>
              )}
              {patient.dateOfBirth && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>
                    {format(patient.dateOfBirth, 'dd/MM/yyyy', { locale: fr })}
                  </span>
                </div>
              )}
            </div>

            {patient.tags && patient.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {patient.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="rounded-full">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Annuler
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="lg:col-span-2 shadow-sm border-0">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-xl">
              <TabsTrigger value="info" className="rounded-xl">Informations</TabsTrigger>
              <TabsTrigger value="appointments" className="rounded-xl">Rendez-vous</TabsTrigger>
              <TabsTrigger value="notes" className="rounded-xl">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nom complet</Label>
                      <Input
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Téléphone</Label>
                      <Input
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>

                  <Button
                    onClick={handleSave}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700"
                    disabled={isSaving}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Sauvegarde...' : 'Enregistrer'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-gray-500">Nom complet</Label>
                    <p className="text-base font-medium">{patient.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Téléphone</Label>
                    <p className="text-base font-medium">{patient.phone}</p>
                  </div>
                  {patient.email && (
                    <div>
                      <Label className="text-sm text-gray-500">Email</Label>
                      <p className="text-base font-medium">{patient.email}</p>
                    </div>
                  )}
                  {patient.dateOfBirth && (
                    <div>
                      <Label className="text-sm text-gray-500">Date de naissance</Label>
                      <p className="text-base font-medium">
                        {format(patient.dateOfBirth, 'dd/MM/yyyy', { locale: fr })}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="appointments" className="mt-6">
              <div className="space-y-6">
                {upcomingAppointments.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-4">Rendez-vous à venir</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Heure</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {upcomingAppointments.map((apt) => (
                          <TableRow key={apt.id}>
                            <TableCell>
                              {format(new Date(apt.date), 'dd/MM/yyyy', { locale: fr })}
                            </TableCell>
                            <TableCell>{apt.time}</TableCell>
                            <TableCell>
                              {dentist?.services.find(s => s.id === apt.serviceId)?.name || 'N/A'}
                            </TableCell>
                            <TableCell>{getStatusBadge(apt.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {pastAppointments.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-4">Historique</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Heure</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pastAppointments.map((apt) => (
                          <TableRow key={apt.id}>
                            <TableCell>
                              {format(new Date(apt.date), 'dd/MM/yyyy', { locale: fr })}
                            </TableCell>
                            <TableCell>{apt.time}</TableCell>
                            <TableCell>
                              {dentist?.services.find(s => s.id === apt.serviceId)?.name || 'N/A'}
                            </TableCell>
                            <TableCell>{getStatusBadge(apt.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {patient.appointments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Aucun rendez-vous enregistré
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="notes" className="mt-6">
              <div className="space-y-4">
                <Label>Notes médicales</Label>
                <Textarea
                  value={formData.notes || patient.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="rounded-xl"
                  rows={10}
                  placeholder="Ajoutez des notes sur ce patient..."
                />
                <Button
                  onClick={handleSave}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700"
                  disabled={isSaving}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Sauvegarde...' : 'Enregistrer les notes'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

