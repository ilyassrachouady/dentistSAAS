import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarScheduler } from '@/components/ui/calendar-scheduler';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { toast } from 'sonner';
import type { AppointmentStatus } from '@/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";


interface NewAppointmentFormProps {
  dentistId: string;
  onSuccess: () => void;
}

export default function NewAppointmentForm({ dentistId, onSuccess }: NewAppointmentFormProps) {
  const [dentist, setDentist] = useState<any>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const d = await api.getDentist(dentistId);
        setDentist(d);
      } catch (e) {
        // ignore
      }
    };
    load();
  }, [dentistId]);

  useEffect(() => {
    if (date) loadAvailableSlots();
  }, [date, dentist]);

  const loadAvailableSlots = async () => {
    if (!date || !dentist) return;
    try {
      const slots = await api.getAvailableSlots(dentist.id, date);
      setAvailableSlots(slots || []);
      setTime('');
    } catch (error) {
      console.error('Error loading slots:', error);
      setAvailableSlots([]);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!date || !time || !serviceId || !patientName || !patientPhone) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsLoading(true);
    try {
      const patients = await api.getPatients(dentistId);
      let patient = patients.find((p: any) => p.phone === patientPhone);
      if (!patient) {
        patient = await api.createPatient({ dentistId, name: patientName, phone: patientPhone, email: patientEmail || undefined });
      }
      if (!patient) {
        toast.error('Erreur lors de la création du patient');
        setIsLoading(false);
        return;
      }
      await api.createAppointment({ dentistId, patientId: patient.id, serviceId, date, time, status: 'scheduled' as AppointmentStatus, notes: notes || undefined });
      toast.success('Rendez-vous créé avec succès');
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la création du rendez-vous');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-2xl shadow-xl border p-8">
        <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Nouveau rendez-vous</h2>
            <p className="text-gray-500 mt-1">Remplissez les informations pour créer un rendez-vous.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3']} className="w-full space-y-6">
            <AccordionItem value="item-1" className="border-b-0">
                <AccordionTrigger className="text-lg font-semibold text-gray-800 rounded-xl bg-gray-50 px-6 py-4 border shadow-sm hover:no-underline">
                    Informations du Patient
                </AccordionTrigger>
                <AccordionContent className="pt-6 px-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <Label className="text-sm font-semibold mb-2 block">Nom du patient *</Label>
                            <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} className="rounded-xl" required />
                        </div>
                        <div>
                            <Label className="text-sm font-semibold mb-2 block">Téléphone *</Label>
                            <Input type="tel" value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} className="rounded-xl" required />
                        </div>
                        <div>
                            <Label className="text-sm font-semibold mb-2 block">Email</Label>
                            <Input type="email" value={patientEmail} onChange={(e) => setPatientEmail(e.target.value)} className="rounded-xl" />
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-b-0">
                <AccordionTrigger className="text-lg font-semibold text-gray-800 rounded-xl bg-gray-50 px-6 py-4 border shadow-sm hover:no-underline">
                    Service et Notes
                </AccordionTrigger>
                <AccordionContent className="pt-6 px-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label className="text-sm font-semibold mb-2 block">Service *</Label>
                            <Select value={serviceId} onValueChange={setServiceId} required>
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Sélectionnez" />
                                </SelectTrigger>
                                <SelectContent>
                                    {dentist?.services?.map((service: any) => (
                                    <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-sm font-semibold mb-2 block">Notes</Label>
                            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl" rows={5} />
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-b-0">
                <AccordionTrigger className="text-lg font-semibold text-gray-800 rounded-xl bg-gray-50 px-6 py-4 border shadow-sm hover:no-underline">
                    Date et Heure
                </AccordionTrigger>
                <AccordionContent className="pt-6 px-2">
                    <div className="rounded-xl border p-4">
                        <CalendarScheduler
                            timeSlots={availableSlots}
                            disabledDates={(d) => d < new Date()}
                            onDateChange={(d) => setDate(d)}
                            onConfirm={({ date: d, time: t }) => {
                                if (d) setDate(d);
                                if (t) setTime(t);
                            }}
                        />
                        {date && time && (
                            <div className="mt-4 text-center text-md font-semibold text-blue-600 bg-blue-50 rounded-lg p-3">
                                Rendez-vous le {format(date, 'EEEE d MMMM yyyy', { locale: fr })} à {time}
                            </div>
                        )}
                    </div>
                </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex justify-end mt-8">
            <Button type="submit" className="rounded-xl bg-blue-600 hover:bg-blue-700 px-10 py-6 text-base font-semibold" disabled={isLoading}>
              {isLoading ? 'Création...' : 'Confirmer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
