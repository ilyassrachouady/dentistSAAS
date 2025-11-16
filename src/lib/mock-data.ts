import { Dentist, Patient, Appointment, Service, User } from '@/types';
import { addDays, addHours, setHours, setMinutes } from 'date-fns';

// Demo Dentist Data
export const demoDentist: Dentist = {
  id: 'demo-dentist-1',
  userId: 'demo-user-1',
  name: 'Dr. Ahmed Benali',
  specialty: 'Orthodontie & Implantologie',
  address: '123 Avenue Mohammed V',
  city: 'Casablanca',
  phone: '+212 6 12 34 56 78',
  email: 'ahmed.benali@ocliq.ma',
  // Use a realistic portrait for demo sharing (LinkedIn-style)
  photo: 'https://media.licdn.com/dms/image/v2/C5603AQGKiAGKx1XIoQ/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1549063069279?e=2147483647&v=beta&t=7jtoycg_8WmeKjxzLfZQRPdrWdh0zy5GPPQr--1uq-w',
  bio: 'Spécialiste en orthodontie avec plus de 15 ans d\'expérience. Expert en implants dentaires et traitements esthétiques.',
  workingHours: {
    monday: { start: '09:00', end: '18:00', enabled: true },
    tuesday: { start: '09:00', end: '18:00', enabled: true },
    wednesday: { start: '09:00', end: '18:00', enabled: true },
    thursday: { start: '09:00', end: '18:00', enabled: true },
    friday: { start: '09:00', end: '14:00', enabled: true },
  saturday: { start: '10:00', end: '12:00', enabled: true },
    sunday: { start: '10:00', end: '14:00', enabled: false },
  },
  vacationDates: [],
  services: [
    { id: 's1', name: 'Consultation', description: 'Consultation générale', duration: 30, price: 200 },
    { id: 's2', name: 'Détartrage', description: 'Nettoyage professionnel', duration: 45, price: 300 },
    { id: 's3', name: 'Blanchiment', description: 'Blanchiment des dents', duration: 60, price: 1500 },
    { id: 's4', name: 'Implant dentaire', description: 'Pose d\'implant', duration: 120, price: 5000 },
    { id: 's5', name: 'Orthodontie', description: 'Consultation orthodontique', duration: 45, price: 400 },
    { id: 's6', name: 'Soin carie', description: 'Traitement de carie', duration: 45, price: 500 },
  ],
  bookingPageId: 'demo-dentist-1',
  reviews: [
    {
      id: 'r1',
      name: 'Saliha B.',
      rating: 5,
      comment: 'Excellent suivi, très professionnel. Cabinet propre et personnel sympathique.',
      date: new Date('2024-02-01'),
    },
    {
      id: 'r2',
      name: 'Youssef A.',
      rating: 4,
      comment: 'Soins rapides et efficaces. Je recommande.',
      date: new Date('2024-03-15'),
    },
    {
      id: 'r3',
      name: 'Nadia R.',
      rating: 5,
      comment: 'Très bonne expérience, je reviendrai pour les contrôles.',
      date: new Date('2024-04-02'),
    },
  ],
};

export const demoUser: User = {
  id: 'demo-user-1',
  email: 'demo@ocliq.ma',
  name: 'Dr. Ahmed Benali',
  role: 'dentist',
  phone: '+212 6 12 34 56 78',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed',
};

// Generate time slots
const generateTimeSlots = (start: string, end: string, interval: number = 30): string[] => {
  const slots: string[] = [];
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  
  let currentHour = startHour;
  let currentMin = startMin;
  
  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    slots.push(`${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`);
    currentMin += interval;
    if (currentMin >= 60) {
      currentMin = 0;
      currentHour++;
    }
  }
  
  return slots;
};

// Mock Patients
export const mockPatients: Patient[] = [
  {
    id: 'p1',
    name: 'Fatima Alami',
    phone: '+212 6 11 22 33 44',
    email: 'fatima.alami@email.com',
    dateOfBirth: new Date('1985-05-15'),
    tags: ['VIP', 'Régulier'],
    notes: 'Patient régulier, sensible aux anesthésies',
    createdAt: new Date('2024-01-15'),
    appointments: [],
  },
  {
    id: 'p2',
    name: 'Mohammed Idrissi',
    phone: '+212 6 22 33 44 55',
    email: 'm.idrissi@email.com',
    tags: ['Nouveau'],
    createdAt: new Date('2024-02-01'),
    appointments: [],
  },
  {
    id: 'p3',
    name: 'Aicha Bensaid',
    phone: '+212 6 33 44 55 66',
    tags: ['Régulier'],
    createdAt: new Date('2024-01-20'),
    appointments: [],
  },
  {
    id: 'p4',
    name: 'Youssef Amrani',
    phone: '+212 6 44 55 66 77',
    tags: ['VIP'],
    createdAt: new Date('2024-01-10'),
    appointments: [],
  },
];

// Mock Appointments
const today = new Date();
const tomorrow = addDays(today, 1);
const nextWeek = addDays(today, 7);

export const mockAppointments: Appointment[] = [
  {
    id: 'a1',
    dentistId: demoDentist.id,
    patientId: 'p1',
    serviceId: 's1',
    date: setHours(setMinutes(today, 30), 10),
    time: '10:30',
    status: 'confirmed',
    notes: 'Consultation de suivi',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'a2',
    dentistId: demoDentist.id,
    patientId: 'p2',
    serviceId: 's2',
    date: setHours(setMinutes(today, 0), 14),
    time: '14:00',
    status: 'confirmed',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25'),
  },
  {
    id: 'a3',
    dentistId: demoDentist.id,
    patientId: 'p3',
    serviceId: 's3',
    date: setHours(setMinutes(tomorrow, 0), 11),
    time: '11:00',
    status: 'pending',
    createdAt: new Date('2024-01-28'),
    updatedAt: new Date('2024-01-28'),
  },
  {
    id: 'a4',
    dentistId: demoDentist.id,
    patientId: 'p4',
    serviceId: 's4',
    date: setHours(setMinutes(nextWeek, 30), 9),
    time: '09:30',
    status: 'confirmed',
    notes: 'Implant molaire supérieure droite',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'a5',
    dentistId: demoDentist.id,
    patientId: 'p1',
    serviceId: 's5',
    date: setHours(setMinutes(today, 30), 16),
    time: '16:30',
    status: 'completed',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
];

// Link appointments to patients
mockPatients.forEach(patient => {
  patient.appointments = mockAppointments.filter(apt => apt.patientId === patient.id);
});

// Storage helpers
export const storage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  setItem: (key: string, value: any) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
};

// Check if demo mode is enabled
export const isDemoMode = (): boolean => {
  return storage.getItem('demoMode') === true;
};

export const setDemoMode = (enabled: boolean) => {
  storage.setItem('demoMode', enabled);
};

// Get available time slots for a date
export const getAvailableTimeSlots = (date: Date, dentist: Dentist, existingAppointments: Appointment[]): string[] => {
  // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayIndex = date.getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const dayName = dayNames[dayIndex] as keyof typeof dentist.workingHours;
  const dayHours = dentist.workingHours[dayName];
  
  if (!dayHours || !dayHours.enabled) {
    return [];
  }
  
  const allSlots = generateTimeSlots(dayHours.start, dayHours.end, 30);
  const dateStr = date.toISOString().split('T')[0];
  
  // Filter out booked slots
  const bookedSlots = existingAppointments
    .filter(apt => {
      const aptDate = new Date(apt.date).toISOString().split('T')[0];
      return aptDate === dateStr && apt.status !== 'cancelled';
    })
    .map(apt => apt.time);
  
  return allSlots.filter(slot => !bookedSlots.includes(slot));
};

