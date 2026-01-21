import { useState, useEffect } from "react";
import { format } from "date-fns";
import heic2any from "heic2any";
import { useNavigate } from "react-router-dom";
import { 
  Users, Calendar, DollarSign, CheckCircle, 
  LogOut, Plus, Search, MoreVertical, 
  UserCheck, Clock, AlertCircle, RefreshCw, Trash2, Edit, MapPin,
  Camera, Heart, History, Send, CalendarIcon, FileText, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatDateOnly, parseDateOnly } from "@/lib/dateOnly";

interface Registration {
  id: string;
  child_name: string;
  age: string;
  date_of_birth: string;
  parent_name: string;
  email: string;
  phone: string;
  experience: string | null;
  notes: string | null;
  payment_status: string;
  sessions_attended: number;
  created_at: string;
}

interface Schedule {
  id: string;
  day: string;
  time: string;
  age_group: string;
  session_type: string;
  location_id: string | null;
  locations?: { name: string; address: string | null };
}

interface Location {
  id: string;
  name: string;
  address: string | null;
}

interface AttendanceRecord {
  id: string;
  registration_id: string;
  session_date: string;
  marked_at: string;
  notes: string | null;
}

interface GalleryItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  file_url: string;
  thumbnail_url: string | null;
  created_at: string;
}

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  website_url: string | null;
  display_order: number;
  is_active: boolean;
}

interface Waiver {
  id: string;
  registration_id: string;
  parent_email: string;
  player_name: string;
  player_dob: string;
  parent_guardian_name: string;
  phone_email: string;
  health_participation: boolean;
  emergency_medical: boolean;
  concussion_awareness: boolean;
  media_consent: boolean;
  parent_signature: string;
  parent_signed_date: string;
  player_signature: string | null;
  player_signed_date: string | null;
  created_at: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIMES = [
  '6:00 AM', '6:15 AM', '6:30 AM', '6:45 AM',
  '7:00 AM', '7:15 AM', '7:30 AM', '7:45 AM',
  '8:00 AM', '8:15 AM', '8:30 AM', '8:45 AM',
  '9:00 AM', '9:15 AM', '9:30 AM', '9:45 AM',
  '10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM',
  '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM',
  '12:00 PM', '12:15 PM', '12:30 PM', '12:45 PM',
  '1:00 PM', '1:15 PM', '1:30 PM', '1:45 PM',
  '2:00 PM', '2:15 PM', '2:30 PM', '2:45 PM',
  '3:00 PM', '3:15 PM', '3:30 PM', '3:45 PM',
  '4:00 PM', '4:15 PM', '4:30 PM', '4:45 PM',
  '5:00 PM', '5:15 PM', '5:30 PM', '5:45 PM',
  '6:00 PM', '6:15 PM', '6:30 PM', '6:45 PM',
  '7:00 PM', '7:15 PM', '7:30 PM', '7:45 PM',
  '8:00 PM', '8:15 PM', '8:30 PM', '8:45 PM',
  '9:00 PM'
];
const AGE_GROUPS = ['5-8', '9-12', '13-16', 'All Ages'];
const SESSION_TYPES = ['Fundamentals', 'Skills', 'Games', 'Match', 'Training', 'Practice'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [players, setPlayers] = useState<Registration[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Registration | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isGalleryDialogOpen, setIsGalleryDialogOpen] = useState(false);
  const [isSponsorDialogOpen, setIsSponsorDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedPlayerHistory, setSelectedPlayerHistory] = useState<Registration | null>(null);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [sponsorUploading, setSponsorUploading] = useState(false);
  const [newGalleryItem, setNewGalleryItem] = useState({ title: "", description: "", type: "photo" });
  const [newSponsor, setNewSponsor] = useState({ name: "", description: "", website_url: "" });
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [sponsorLogo, setSponsorLogo] = useState<File | null>(null);
  const [newPlayer, setNewPlayer] = useState({
    child_name: "", age: "", date_of_birth: undefined as Date | undefined, parent_name: "", phone: "", email: "", experience: ""
  });
  const [newSchedule, setNewSchedule] = useState({
    day: "", time: "", age_group: "", session_type: "", location_id: ""
  });
  const [newLocation, setNewLocation] = useState({ name: "", address: "" });
  const [editingPlayer, setEditingPlayer] = useState<Registration | null>(null);
  const [isEditPlayerDialogOpen, setIsEditPlayerDialogOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<AttendanceRecord | null>(null);
  const [isEditAttendanceDialogOpen, setIsEditAttendanceDialogOpen] = useState(false);
  const [editAttendanceDate, setEditAttendanceDate] = useState("");
  const [waivers, setWaivers] = useState<Waiver[]>([]);
  const [selectedWaiver, setSelectedWaiver] = useState<Waiver | null>(null);
  const [isWaiverDialogOpen, setIsWaiverDialogOpen] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/admin");
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/admin");
      } else {
        fetchPlayers();
        fetchSchedules();
        fetchLocations();
        fetchAttendanceRecords();
        fetchGalleryItems();
        fetchSponsors();
        fetchWaivers();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchPlayers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching players:', error);
      toast({ title: "Error loading players", variant: "destructive" });
    } else {
      setPlayers(data || []);
    }
    setLoading(false);
  };

  const fetchSchedules = async () => {
    const { data, error } = await supabase
      .from('schedules')
      .select('*, locations(name, address)')
      .order('day', { ascending: true });

    if (error) {
      console.error('Error fetching schedules:', error);
    } else {
      setSchedules(data || []);
    }
  };

  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching locations:', error);
    } else {
      setLocations(data || []);
    }
  };

  const fetchAttendanceRecords = async () => {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .order('session_date', { ascending: false });

    if (error) {
      console.error('Error fetching attendance:', error);
    } else {
      setAttendanceRecords(data || []);
    }
  };

  const fetchGalleryItems = async () => {
    const { data, error } = await supabase
      .from('gallery_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching gallery:', error);
    } else {
      setGalleryItems(data || []);
    }
  };

  const fetchSponsors = async () => {
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching sponsors:', error);
    } else {
      setSponsors(data || []);
    }
  };

  const fetchWaivers = async () => {
    const { data, error } = await supabase
      .from('waivers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching waivers:', error);
    } else {
      setWaivers(data || []);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged out successfully" });
    navigate("/admin");
  };

  const filteredPlayers = players.filter(player => 
    player.child_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.parent_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddPlayer = async () => {
    if (!newPlayer.child_name || !newPlayer.date_of_birth || !newPlayer.parent_name) {
      toast({ title: "Please fill required fields (Name, DOB, Parent)", variant: "destructive" });
      return;
    }

    // Calculate age from date of birth
    const today = new Date();
    const birthDate = newPlayer.date_of_birth;
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    
    const { error } = await supabase.from('registrations').insert({
      child_name: newPlayer.child_name,
      date_of_birth: formatDateOnly(newPlayer.date_of_birth),
      age: calculatedAge.toString(),
      parent_name: newPlayer.parent_name,
      phone: newPlayer.phone,
      email: newPlayer.email,
      experience: newPlayer.experience || null,
    });

    if (error) {
      toast({ title: "Error adding player", variant: "destructive" });
    } else {
      setNewPlayer({ child_name: "", age: "", date_of_birth: undefined, parent_name: "", phone: "", email: "", experience: "" });
      setIsAddDialogOpen(false);
      toast({ title: "Player added successfully!" });
      fetchPlayers();
    }
  };

  const openAttendanceDialog = (player: Registration) => {
    setSelectedPlayer(player);
    setAttendanceDate(new Date().toISOString().split('T')[0]);
    setIsAttendanceDialogOpen(true);
  };

  const handleMarkAttendance = async () => {
    if (!selectedPlayer) return;
    
    const newSessions = selectedPlayer.sessions_attended >= 8 ? 1 : selectedPlayer.sessions_attended + 1;
    const needsPayment = selectedPlayer.sessions_attended >= 7;
    
    const { error } = await supabase
      .from('registrations')
      .update({ 
        sessions_attended: newSessions,
        payment_status: needsPayment ? 'pending' : undefined
      })
      .eq('id', selectedPlayer.id);

    if (error) {
      toast({ title: "Error marking attendance", variant: "destructive" });
    } else {
      // Also record in attendance_records with selected date
      await supabase.from('attendance_records').insert({
        registration_id: selectedPlayer.id,
        session_date: attendanceDate
      });
      toast({ title: "Attendance marked for " + attendanceDate });
      setIsAttendanceDialogOpen(false);
      setSelectedPlayer(null);
      fetchPlayers();
      fetchAttendanceRecords();
    }
  };

  const getPlayerAttendance = (playerId: string) => {
    return attendanceRecords.filter(r => r.registration_id === playerId);
  };

  const handleTogglePayment = async (playerId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    const resetSessions = newStatus === 'paid';
    
    const { error } = await supabase
      .from('registrations')
      .update({ 
        payment_status: newStatus,
        sessions_attended: resetSessions ? 0 : undefined
      })
      .eq('id', playerId);

    if (error) {
      toast({ title: "Error updating payment", variant: "destructive" });
    } else {
      toast({ title: newStatus === 'paid' ? "Marked as paid" : "Marked as pending" });
      fetchPlayers();
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('id', playerId);

    if (error) {
      toast({ title: "Error removing player", variant: "destructive" });
    } else {
      toast({ title: "Player removed" });
      fetchPlayers();
    }
  };

  const handleAddSchedule = async () => {
    if (!newSchedule.day || !newSchedule.time || !newSchedule.age_group || !newSchedule.session_type) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    
    const { error } = await supabase.from('schedules').insert({
      day: newSchedule.day,
      time: newSchedule.time,
      age_group: newSchedule.age_group,
      session_type: newSchedule.session_type,
      location_id: newSchedule.location_id || null,
    });

    if (error) {
      toast({ title: "Error adding session", variant: "destructive" });
    } else {
      setNewSchedule({ day: "", time: "", age_group: "", session_type: "", location_id: "" });
      setIsScheduleDialogOpen(false);
      toast({ title: "Session added!" });
      fetchSchedules();
    }
  };

  const handleUpdateSchedule = async () => {
    if (!editingSchedule || !newSchedule.day || !newSchedule.time || !newSchedule.age_group || !newSchedule.session_type) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    
    const { error } = await supabase
      .from('schedules')
      .update({
        day: newSchedule.day,
        time: newSchedule.time,
        age_group: newSchedule.age_group,
        session_type: newSchedule.session_type,
        location_id: newSchedule.location_id || null,
      })
      .eq('id', editingSchedule.id);

    if (error) {
      toast({ title: "Error updating session", variant: "destructive" });
    } else {
      setNewSchedule({ day: "", time: "", age_group: "", session_type: "", location_id: "" });
      setEditingSchedule(null);
      setIsScheduleDialogOpen(false);
      toast({ title: "Session updated!" });
      fetchSchedules();
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) {
      toast({ title: "Error removing session", variant: "destructive" });
    } else {
      toast({ title: "Session removed" });
      fetchSchedules();
    }
  };

  const handleAddLocation = async () => {
    if (!newLocation.name) {
      toast({ title: "Please enter location name", variant: "destructive" });
      return;
    }
    
    const { error } = await supabase.from('locations').insert({
      name: newLocation.name,
      address: newLocation.address || null,
    });

    if (error) {
      toast({ title: "Error adding location", variant: "destructive" });
    } else {
      setNewLocation({ name: "", address: "" });
      setIsLocationDialogOpen(false);
      toast({ title: "Location added!" });
      fetchLocations();
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', locationId);

    if (error) {
      toast({ title: "Error removing location", variant: "destructive" });
    } else {
      toast({ title: "Location removed" });
      fetchLocations();
    }
  };

  const openEditPlayer = (player: Registration) => {
    setEditingPlayer(player);
    setNewPlayer({
      child_name: player.child_name,
      age: player.age,
      date_of_birth: parseDateOnly(player.date_of_birth),
      parent_name: player.parent_name,
      phone: player.phone,
      email: player.email,
      experience: player.experience || "",
    });
    setIsEditPlayerDialogOpen(true);
  };

  const handleUpdatePlayer = async () => {
    if (!editingPlayer || !newPlayer.child_name || !newPlayer.date_of_birth || !newPlayer.parent_name) {
      toast({ title: "Please fill required fields (Name, DOB, Parent)", variant: "destructive" });
      return;
    }

    // Calculate age from date of birth
    const today = new Date();
    const birthDate = newPlayer.date_of_birth;
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    
    const { error } = await supabase
      .from('registrations')
      .update({
        child_name: newPlayer.child_name,
        date_of_birth: formatDateOnly(newPlayer.date_of_birth),
        age: calculatedAge.toString(),
        parent_name: newPlayer.parent_name,
        phone: newPlayer.phone,
        email: newPlayer.email,
        experience: newPlayer.experience || null,
      })
      .eq('id', editingPlayer.id);

    if (error) {
      toast({ title: "Error updating player", variant: "destructive" });
    } else {
      setNewPlayer({ child_name: "", age: "", date_of_birth: undefined, parent_name: "", phone: "", email: "", experience: "" });
      setEditingPlayer(null);
      setIsEditPlayerDialogOpen(false);
      toast({ title: "Player updated successfully!" });
      fetchPlayers();
    }
  };

  const openEditAttendance = (record: AttendanceRecord) => {
    setEditingAttendance(record);
    setEditAttendanceDate(record.session_date);
    setIsEditAttendanceDialogOpen(true);
  };

  const handleUpdateAttendance = async () => {
    if (!editingAttendance || !editAttendanceDate) {
      toast({ title: "Please select a date", variant: "destructive" });
      return;
    }
    
    const { error } = await supabase
      .from('attendance_records')
      .update({ session_date: editAttendanceDate })
      .eq('id', editingAttendance.id);

    if (error) {
      toast({ title: "Error updating attendance", variant: "destructive" });
    } else {
      setEditingAttendance(null);
      setIsEditAttendanceDialogOpen(false);
      toast({ title: "Attendance updated!" });
      fetchAttendanceRecords();
    }
  };

  const handleDeleteAttendance = async (recordId: string, playerId: string) => {
    const { error: deleteError } = await supabase
      .from('attendance_records')
      .delete()
      .eq('id', recordId);

    if (deleteError) {
      toast({ title: "Error deleting attendance", variant: "destructive" });
      return;
    }

    // Decrement sessions_attended for the player
    const player = players.find(p => p.id === playerId);
    if (player && player.sessions_attended > 0) {
      await supabase
        .from('registrations')
        .update({ sessions_attended: player.sessions_attended - 1 })
        .eq('id', playerId);
    }

    toast({ title: "Attendance record deleted" });
    fetchAttendanceRecords();
    fetchPlayers();
  };

  // Calculate payment block history based on attendance records
  const getPaymentBlockHistory = (playerId: string) => {
    const playerAttendance = attendanceRecords
      .filter(r => r.registration_id === playerId)
      .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());
    
    const blocks: { blockNumber: number; startDate: string; endDate: string; sessions: number }[] = [];
    
    for (let i = 0; i < playerAttendance.length; i += 8) {
      const blockRecords = playerAttendance.slice(i, i + 8);
      if (blockRecords.length > 0) {
        blocks.push({
          blockNumber: Math.floor(i / 8) + 1,
          startDate: blockRecords[0].session_date,
          endDate: blockRecords[blockRecords.length - 1].session_date,
          sessions: blockRecords.length
        });
      }
    }
    
    return blocks.slice(-8); // Return last 8 blocks
  };

  const openEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setNewSchedule({
      day: schedule.day,
      time: schedule.time,
      age_group: schedule.age_group,
      session_type: schedule.session_type,
      location_id: schedule.location_id || "",
    });
    setIsScheduleDialogOpen(true);
  };

  const openAddSchedule = () => {
    setEditingSchedule(null);
    setNewSchedule({ day: "", time: "", age_group: "", session_type: "", location_id: "" });
    setIsScheduleDialogOpen(true);
  };

  const openHistoryDialog = (player: Registration) => {
    setSelectedPlayerHistory(player);
    setIsHistoryDialogOpen(true);
  };

  const handleAddGalleryItem = async () => {
    if (!newGalleryItem.title || !galleryFile) {
      toast({ title: "Please provide title and file", variant: "destructive" });
      return;
    }

    setGalleryUploading(true);
    
    let fileToUpload: File | Blob = galleryFile;
    let fileExt = galleryFile.name.split('.').pop()?.toLowerCase();
    
    // Convert HEIC/HEIF to JPG
    if (fileExt === 'heic' || fileExt === 'heif') {
      try {
        toast({ title: "Converting HEIC to JPG...", description: "Please wait" });
        const convertedBlob = await heic2any({
          blob: galleryFile,
          toType: "image/jpeg",
          quality: 0.9
        });
        fileToUpload = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        fileExt = 'jpg';
      } catch (conversionError) {
        console.error("HEIC conversion error:", conversionError);
        toast({ title: "Error converting HEIC file", description: "Please try uploading a JPG or PNG instead", variant: "destructive" });
        setGalleryUploading(false);
        return;
      }
    }
    
    const fileName = `${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(fileName, fileToUpload);

    if (uploadError) {
      toast({ title: "Error uploading file", variant: "destructive" });
      setGalleryUploading(false);
      return;
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(fileName);

    // Insert gallery item
    const { error } = await supabase.from('gallery_items').insert({
      title: newGalleryItem.title,
      description: newGalleryItem.description || null,
      type: newGalleryItem.type,
      file_url: urlData.publicUrl,
    });

    if (error) {
      toast({ title: "Error adding gallery item", variant: "destructive" });
    } else {
      setNewGalleryItem({ title: "", description: "", type: "photo" });
      setGalleryFile(null);
      setIsGalleryDialogOpen(false);
      toast({ title: "Gallery item added!" });
      fetchGalleryItems();
    }
    setGalleryUploading(false);
  };

  const handleDeleteGalleryItem = async (itemId: string, fileUrl: string) => {
    // Extract filename from URL
    const fileName = fileUrl.split('/').pop();
    
    // Delete from storage
    if (fileName) {
      await supabase.storage.from('gallery').remove([fileName]);
    }

    // Delete from database
    const { error } = await supabase.from('gallery_items').delete().eq('id', itemId);

    if (error) {
      toast({ title: "Error removing item", variant: "destructive" });
    } else {
      toast({ title: "Item removed" });
      fetchGalleryItems();
    }
  };

  const handleAddSponsor = async () => {
    if (!newSponsor.name) {
      toast({ title: "Please provide sponsor name", variant: "destructive" });
      return;
    }

    setSponsorUploading(true);
    let logoUrl = null;

    // Upload logo if provided
    if (sponsorLogo) {
      const fileExt = sponsorLogo.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('sponsors')
        .upload(fileName, sponsorLogo);

      if (uploadError) {
        toast({ title: "Error uploading logo", variant: "destructive" });
        setSponsorUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('sponsors').getPublicUrl(fileName);
      logoUrl = urlData.publicUrl;
    }

    // Insert sponsor
    const { error } = await supabase.from('sponsors').insert({
      name: newSponsor.name,
      description: newSponsor.description || null,
      website_url: newSponsor.website_url || null,
      logo_url: logoUrl,
      display_order: sponsors.length,
    });

    if (error) {
      toast({ title: "Error adding sponsor", variant: "destructive" });
    } else {
      setNewSponsor({ name: "", description: "", website_url: "" });
      setSponsorLogo(null);
      setIsSponsorDialogOpen(false);
      toast({ title: "Sponsor added!" });
      fetchSponsors();
    }
    setSponsorUploading(false);
  };

  const handleDeleteSponsor = async (sponsorId: string, logoUrl: string | null) => {
    // Delete logo from storage
    if (logoUrl) {
      const fileName = logoUrl.split('/').pop();
      if (fileName) {
        await supabase.storage.from('sponsors').remove([fileName]);
      }
    }

    // Delete from database
    const { error } = await supabase.from('sponsors').delete().eq('id', sponsorId);

    if (error) {
      toast({ title: "Error removing sponsor", variant: "destructive" });
    } else {
      toast({ title: "Sponsor removed" });
      fetchSponsors();
    }
  };

  const handleToggleSponsorActive = async (sponsorId: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('sponsors')
      .update({ is_active: !currentActive })
      .eq('id', sponsorId);

    if (error) {
      toast({ title: "Error updating sponsor", variant: "destructive" });
    } else {
      toast({ title: currentActive ? "Sponsor hidden" : "Sponsor visible" });
      fetchSponsors();
    }
  };

  const uniqueDays = [...new Set(schedules.map(s => s.day))].sort((a, b) => 
    DAYS.indexOf(a) - DAYS.indexOf(b)
  );

  const stats = {
    totalPlayers: players.length,
    paidPlayers: players.filter(p => p.payment_status === 'paid').length,
    pendingPlayers: players.filter(p => p.payment_status !== 'paid').length,
    sessionsThisWeek: schedules.length,
  };

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-xl text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Mighty Athletic Academy - Coach David Maldonado</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={fetchPlayers}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-none shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Players</p>
                  <p className="font-heading font-bold text-2xl text-foreground">{stats.totalPlayers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paid</p>
                  <p className="font-heading font-bold text-2xl text-foreground">{stats.paidPlayers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-pending/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-pending" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="font-heading font-bold text-2xl text-foreground">{stats.pendingPlayers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sessions/Week</p>
                  <p className="font-heading font-bold text-2xl text-foreground">{stats.sessionsThisWeek}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="players" className="space-y-6">
          <TabsList className="bg-card p-1 flex-wrap h-auto">
            <TabsTrigger value="players" className="gap-2">
              <Users className="w-4 h-4" />
              Players
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-2">
              <UserCheck className="w-4 h-4" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <DollarSign className="w-4 h-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <Calendar className="w-4 h-4" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="locations" className="gap-2">
              <MapPin className="w-4 h-4" />
              Locations
            </TabsTrigger>
            <TabsTrigger value="gallery" className="gap-2">
              <Camera className="w-4 h-4" />
              Gallery
            </TabsTrigger>
            <TabsTrigger value="sponsors" className="gap-2">
              <Heart className="w-4 h-4" />
              Sponsors
            </TabsTrigger>
            <TabsTrigger value="waivers" className="gap-2">
              <FileText className="w-4 h-4" />
              Waivers
            </TabsTrigger>
          </TabsList>

          {/* Players Tab */}
          <TabsContent value="players">
            <Card className="border-none shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Player Database</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search players..."
                      className="pl-10 w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Player
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Player</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label>Child's Name *</Label>
                          <Input
                            value={newPlayer.child_name}
                            onChange={(e) => setNewPlayer({ ...newPlayer, child_name: e.target.value })}
                            placeholder="Enter name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Date of Birth *</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !newPlayer.date_of_birth && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {newPlayer.date_of_birth ? format(newPlayer.date_of_birth, "PPP") : <span>Select date of birth</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={newPlayer.date_of_birth}
                                onSelect={(date) => setNewPlayer({ ...newPlayer, date_of_birth: date })}
                                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                                captionLayout="dropdown-buttons"
                                fromYear={2005}
                                toYear={new Date().getFullYear()}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label>Parent Name *</Label>
                          <Input
                            value={newPlayer.parent_name}
                            onChange={(e) => setNewPlayer({ ...newPlayer, parent_name: e.target.value })}
                            placeholder="Parent/Guardian name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input
                            value={newPlayer.phone}
                            onChange={(e) => setNewPlayer({ ...newPlayer, phone: e.target.value })}
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            value={newPlayer.email}
                            onChange={(e) => setNewPlayer({ ...newPlayer, email: e.target.value })}
                            placeholder="email@example.com"
                          />
                        </div>
                        <Button onClick={handleAddPlayer} className="w-full">
                          Add Player
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading players...</div>
                ) : filteredPlayers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No players found. Registrations from the website will appear here.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>DOB</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Parent</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Sessions</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlayers.map((player) => (
                        <TableRow key={player.id}>
                          <TableCell className="font-medium">{player.child_name}</TableCell>
                          <TableCell>
                            {player.date_of_birth ? format(parseDateOnly(player.date_of_birth)!, 'MMM d, yyyy') : '-'}
                          </TableCell>
                          <TableCell>{player.age}</TableCell>
                          <TableCell>{player.parent_name}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{player.phone}</p>
                              <p className="text-muted-foreground">{player.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                                  <div
                                    key={s}
                                    className={`w-2 h-2 rounded-full ${s <= player.sessions_attended ? 'bg-primary' : 'bg-border'}`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-muted-foreground">{player.sessions_attended}/8</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={player.payment_status === 'paid' ? "success" : "pending"}>
                              {player.payment_status === 'paid' ? "Paid" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditPlayer(player)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Player
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openAttendanceDialog(player)}>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Mark Attendance
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleTogglePayment(player.id, player.payment_status)}>
                                  <DollarSign className="w-4 h-4 mr-2" />
                                  Toggle Payment
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeletePlayer(player.id)}
                                  className="text-destructive"
                                >
                                  Remove Player
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <Card className="border-none shadow-card">
              <CardHeader>
                <CardTitle>Quick Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : players.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No players registered yet.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {players.map((player) => (
                      <Card key={player.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">{player.child_name}</p>
                              <p className="text-sm text-muted-foreground">Age {player.age}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex gap-0.5 justify-end mb-2">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                                  <div
                                    key={s}
                                    className={`w-3 h-3 rounded-full ${s <= player.sessions_attended ? 'bg-primary' : 'bg-border'}`}
                                  />
                                ))}
                              </div>
                              <Button 
                                size="sm" 
                                variant={player.sessions_attended >= 8 ? "outline" : "default"}
                                onClick={() => openAttendanceDialog(player)}
                              >
                                <UserCheck className="w-4 h-4 mr-1" />
                                Mark
                              </Button>
                            </div>
                          </div>
                          {player.sessions_attended >= 8 && (
                            <div className="mt-3 pt-3 border-t flex items-center gap-2 text-pending">
                              <AlertCircle className="w-4 h-4" />
                              <span className="text-sm">Payment due</span>
                            </div>
                          )}
                          {/* Attendance History with Edit/Delete */}
                          {getPlayerAttendance(player.id).length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs text-muted-foreground mb-2">Recent attendance:</p>
                              <div className="flex flex-wrap gap-1">
                                {getPlayerAttendance(player.id).slice(0, 5).map((record) => (
                                  <div key={record.id} className="flex items-center gap-1">
                                    <Badge variant="outline" className="text-xs pr-1">
                                      {new Date(record.session_date).toLocaleDateString()}
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
                                            <MoreVertical className="w-3 h-3" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => openEditAttendance(record)}>
                                            <Edit className="w-3 h-3 mr-2" />
                                            Edit Date
                                          </DropdownMenuItem>
                                          <DropdownMenuItem 
                                            onClick={() => handleDeleteAttendance(record.id, player.id)}
                                            className="text-destructive"
                                          >
                                            <Trash2 className="w-3 h-3 mr-2" />
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card className="border-none shadow-card">
              <CardHeader>
                <CardTitle>Payment Status</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : players.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No players registered yet.</div>
                ) : (
                  <div className="space-y-6">
                    {/* Pending Payments */}
                    <div>
                      <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-pending" />
                        Pending Payments ({players.filter(p => p.payment_status !== 'paid').length})
                      </h3>
                      <div className="space-y-2">
                        {players.filter(p => p.payment_status !== 'paid').map((player) => (
                          <div key={player.id} className="flex items-center justify-between p-4 bg-pending/5 rounded-lg border border-pending/20">
                            <div>
                              <p className="font-medium">{player.child_name}</p>
                              <p className="text-sm text-muted-foreground">{player.parent_name} • {player.sessions_attended}/8 sessions</p>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => handleTogglePayment(player.id, player.payment_status)}
                            >
                              Mark Paid
                            </Button>
                          </div>
                        ))}
                        {players.filter(p => p.payment_status !== 'paid').length === 0 && (
                          <p className="text-muted-foreground text-center py-4">All payments are up to date!</p>
                        )}
                      </div>
                    </div>

                    {/* Paid */}
                    <div>
                      <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        Paid ({players.filter(p => p.payment_status === 'paid').length})
                      </h3>
                      <div className="space-y-2">
                        {players.filter(p => p.payment_status === 'paid').map((player) => (
                          <div key={player.id} className="flex items-center justify-between p-4 bg-success/5 rounded-lg border border-success/20">
                            <div>
                              <p className="font-medium">{player.child_name}</p>
                              <p className="text-sm text-muted-foreground">{player.parent_name}</p>
                            </div>
                            <Badge variant="success">Paid</Badge>
                          </div>
                        ))}
                        {players.filter(p => p.payment_status === 'paid').length === 0 && (
                          <p className="text-muted-foreground text-center py-4">No paid players yet.</p>
                        )}
                      </div>
                    </div>

                    {/* Payment Block History */}
                    <div>
                      <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                        <History className="w-4 h-4 text-primary" />
                        Payment Block History (Last 8 Blocks per Player)
                      </h3>
                      <div className="space-y-4">
                        {players.map((player) => {
                          const blockHistory = getPaymentBlockHistory(player.id);
                          if (blockHistory.length === 0) return null;
                          
                          return (
                            <div key={player.id} className="p-4 bg-muted/30 rounded-lg border">
                              <p className="font-medium mb-3">{player.child_name}</p>
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="text-xs">Block #</TableHead>
                                      <TableHead className="text-xs">Start Date</TableHead>
                                      <TableHead className="text-xs">End Date</TableHead>
                                      <TableHead className="text-xs">Sessions</TableHead>
                                      <TableHead className="text-xs">Status</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {blockHistory.map((block) => (
                                      <TableRow key={block.blockNumber}>
                                        <TableCell className="text-xs">{block.blockNumber}</TableCell>
                                        <TableCell className="text-xs">{new Date(block.startDate).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-xs">{new Date(block.endDate).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-xs">{block.sessions}/8</TableCell>
                                        <TableCell>
                                          <Badge variant={block.sessions === 8 ? "success" : "outline"} className="text-xs">
                                            {block.sessions === 8 ? "Complete" : "In Progress"}
                                          </Badge>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          );
                        })}
                        {players.every(p => getPaymentBlockHistory(p.id).length === 0) && (
                          <p className="text-muted-foreground text-center py-4">No attendance history available yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <Card className="border-none shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Weekly Schedule</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{schedules.length} sessions</Badge>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const emails = players.map(p => p.email).filter(Boolean).join(',');
                      const subject = encodeURIComponent('Schedule for the Week');
                      
                      // Group schedules by day
                      const schedulesByDay = DAYS.reduce((acc, day) => {
                        const daySessions = schedules.filter(s => s.day === day);
                        if (daySessions.length > 0) {
                          acc[day] = daySessions;
                        }
                        return acc;
                      }, {} as Record<string, Schedule[]>);
                      
                      // Format schedule details
                      let bodyText = 'Dear Parents,\n\nHere is the training schedule for the week:\n\n';
                      
                      Object.entries(schedulesByDay).forEach(([day, sessions]) => {
                        bodyText += `${day}:\n`;
                        sessions.forEach(session => {
                          const locationName = session.locations?.name || 'TBD';
                          bodyText += `  • ${session.time} - ${session.session_type} (Ages ${session.age_group}) at ${locationName}\n`;
                        });
                        bodyText += '\n';
                      });
                      
                      if (Object.keys(schedulesByDay).length === 0) {
                        bodyText += 'No sessions scheduled for this week.\n\n';
                      }
                      
                      bodyText += 'Please ensure your child arrives 10 minutes early with proper gear.\n\n';
                      bodyText += 'Thank you,\nCoach Maldonado';
                      
                      const body = encodeURIComponent(bodyText);
                      window.open(`https://mail.google.com/mail/?view=cm&to=${emails}&su=${subject}&body=${body}`, '_blank');
                    }}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Publish
                  </Button>
                  <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={openAddSchedule}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Session
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingSchedule ? 'Edit Session' : 'Add New Session'}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label>Day *</Label>
                          <Select
                            value={newSchedule.day}
                            onValueChange={(value) => setNewSchedule({ ...newSchedule, day: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select day" />
                            </SelectTrigger>
                            <SelectContent>
                              {DAYS.map((day) => (
                                <SelectItem key={day} value={day}>{day}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Time *</Label>
                          <Select
                            value={newSchedule.time}
                            onValueChange={(value) => setNewSchedule({ ...newSchedule, time: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                              {TIMES.map((time) => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Age Group *</Label>
                          <Select
                            value={newSchedule.age_group}
                            onValueChange={(value) => setNewSchedule({ ...newSchedule, age_group: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select age group" />
                            </SelectTrigger>
                            <SelectContent>
                              {AGE_GROUPS.map((age) => (
                                <SelectItem key={age} value={age}>{age}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Session Type *</Label>
                          <Select
                            value={newSchedule.session_type}
                            onValueChange={(value) => setNewSchedule({ ...newSchedule, session_type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {SESSION_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Location</Label>
                          <Select
                            value={newSchedule.location_id}
                            onValueChange={(value) => setNewSchedule({ ...newSchedule, location_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                              {locations.map((loc) => (
                                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          onClick={editingSchedule ? handleUpdateSchedule : handleAddSchedule} 
                          className="w-full"
                        >
                          {editingSchedule ? 'Update Session' : 'Add Session'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {schedules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No sessions scheduled. Add your first session above.
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {uniqueDays.map((day) => (
                      <div key={day} className="space-y-2">
                        <h3 className="font-medium text-foreground">{day}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {schedules.filter(s => s.day === day).map((session) => (
                            <div key={session.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Clock className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{session.session_type}</p>
                                  <p className="text-sm text-muted-foreground">Ages {session.age_group}</p>
                                  {session.locations && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                      <MapPin className="w-3 h-3" />
                                      {session.locations.name}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{session.time}</Badge>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openEditSchedule(session)}>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteSchedule(session.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Locations Tab */}
          <TabsContent value="locations">
            <Card className="border-none shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Training Locations</CardTitle>
                <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Location
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Location</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Location Name *</Label>
                        <Input
                          value={newLocation.name}
                          onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                          placeholder="e.g. Deep Run Park"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Input
                          value={newLocation.address}
                          onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                          placeholder="Full address (optional)"
                        />
                      </div>
                      <Button onClick={handleAddLocation} className="w-full">
                        Add Location
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {locations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No locations added. Add your first location above.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {locations.map((location) => (
                      <div key={location.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{location.name}</p>
                            {location.address && (
                              <p className="text-sm text-muted-foreground">{location.address}</p>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteLocation(location.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery">
            <Card className="border-none shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gallery Management</CardTitle>
                <Dialog open={isGalleryDialogOpen} onOpenChange={setIsGalleryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Media
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Photo/Video</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input
                          value={newGalleryItem.title}
                          onChange={(e) => setNewGalleryItem({ ...newGalleryItem, title: e.target.value })}
                          placeholder="e.g. Training Session"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={newGalleryItem.description}
                          onChange={(e) => setNewGalleryItem({ ...newGalleryItem, description: e.target.value })}
                          placeholder="Optional description"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Type *</Label>
                        <Select
                          value={newGalleryItem.type}
                          onValueChange={(value) => setNewGalleryItem({ ...newGalleryItem, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="photo">Photo</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>File *</Label>
                        <Input
                          type="file"
                          accept={newGalleryItem.type === 'photo' ? 'image/*' : 'video/*'}
                          onChange={(e) => setGalleryFile(e.target.files?.[0] || null)}
                        />
                      </div>
                      <Button onClick={handleAddGalleryItem} className="w-full" disabled={galleryUploading}>
                        {galleryUploading ? "Uploading..." : "Add to Gallery"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {galleryItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No gallery items. Add photos and videos above.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {galleryItems.map((item) => (
                      <div key={item.id} className="relative group rounded-lg overflow-hidden border">
                        {item.type === 'photo' ? (
                          <img src={item.file_url} alt={item.title} className="w-full h-48 object-cover" />
                        ) : (
                          <video src={item.file_url} className="w-full h-48 object-cover" />
                        )}
                        <div className="p-3">
                          <p className="font-medium text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.type}</p>
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteGalleryItem(item.id, item.file_url)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sponsors Tab */}
          <TabsContent value="sponsors">
            <Card className="border-none shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Sponsors Management</CardTitle>
                <Dialog open={isSponsorDialogOpen} onOpenChange={setIsSponsorDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Sponsor
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Sponsor</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Sponsor Name *</Label>
                        <Input
                          value={newSponsor.name}
                          onChange={(e) => setNewSponsor({ ...newSponsor, name: e.target.value })}
                          placeholder="e.g. Local Sports Store"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={newSponsor.description}
                          onChange={(e) => setNewSponsor({ ...newSponsor, description: e.target.value })}
                          placeholder="About this sponsor..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Website URL</Label>
                        <Input
                          value={newSponsor.website_url}
                          onChange={(e) => setNewSponsor({ ...newSponsor, website_url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Logo (optional)</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setSponsorLogo(e.target.files?.[0] || null)}
                        />
                      </div>
                      <Button onClick={handleAddSponsor} className="w-full" disabled={sponsorUploading}>
                        {sponsorUploading ? "Uploading..." : "Add Sponsor"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {sponsors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No sponsors added yet. Add your first sponsor above.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sponsors.map((sponsor) => (
                      <div key={sponsor.id} className={`flex items-center justify-between p-4 rounded-lg border ${sponsor.is_active ? 'bg-muted/30' : 'bg-muted/10 opacity-60'}`}>
                        <div className="flex items-center gap-3">
                          {sponsor.logo_url ? (
                            <img src={sponsor.logo_url} alt={sponsor.name} className="w-12 h-12 object-contain rounded" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Heart className="w-6 h-6 text-primary" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{sponsor.name}</p>
                            {sponsor.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">{sponsor.description}</p>
                            )}
                            {!sponsor.is_active && (
                              <Badge variant="outline" className="mt-1">Hidden</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleToggleSponsorActive(sponsor.id, sponsor.is_active)}
                          >
                            {sponsor.is_active ? 'Hide' : 'Show'}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteSponsor(sponsor.id, sponsor.logo_url)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance History Tab */}
          <TabsContent value="history">
            <Card className="border-none shadow-card">
              <CardHeader>
                <CardTitle>Complete Attendance History</CardTitle>
              </CardHeader>
              <CardContent>
                {players.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No players registered yet.</div>
                ) : (
                  <div className="space-y-4">
                    {players.map((player) => {
                      const playerAttendance = getPlayerAttendance(player.id);
                      return (
                        <Card key={player.id} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <p className="font-medium text-foreground">{player.child_name}</p>
                                <p className="text-sm text-muted-foreground">Age {player.age} • {playerAttendance.length} total sessions</p>
                              </div>
                              <Button size="sm" variant="outline" onClick={() => openHistoryDialog(player)}>
                                <History className="w-4 h-4 mr-2" />
                                View All
                              </Button>
                            </div>
                            {playerAttendance.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No attendance recorded yet.</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {playerAttendance.slice(0, 10).map((record) => (
                                  <Badge key={record.id} variant="outline" className="text-xs">
                                    {new Date(record.session_date).toLocaleDateString()}
                                  </Badge>
                                ))}
                                {playerAttendance.length > 10 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{playerAttendance.length - 10} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Waivers Tab */}
          <TabsContent value="waivers">
            <Card className="border-none shadow-card">
              <CardHeader>
                <CardTitle>Signed Waivers</CardTitle>
              </CardHeader>
              <CardContent>
                {waivers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No signed waivers yet. Parents can sign waivers from their dashboard.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player Name</TableHead>
                        <TableHead>Parent/Guardian</TableHead>
                        <TableHead>Date Signed</TableHead>
                        <TableHead>Consents</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {waivers.map((waiver) => (
                        <TableRow key={waiver.id}>
                          <TableCell className="font-medium">{waiver.player_name}</TableCell>
                          <TableCell>{waiver.parent_guardian_name}</TableCell>
                          <TableCell>{format(new Date(waiver.parent_signed_date), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {waiver.health_participation && <Badge variant="outline" className="text-xs">Health</Badge>}
                              {waiver.emergency_medical && <Badge variant="outline" className="text-xs">Emergency</Badge>}
                              {waiver.concussion_awareness && <Badge variant="outline" className="text-xs">Concussion</Badge>}
                              {waiver.media_consent && <Badge variant="secondary" className="text-xs">Media</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedWaiver(waiver);
                                setIsWaiverDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Attendance Dialog */}
        <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Attendance for {selectedPlayer?.child_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Session Date *</Label>
                <Input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                />
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Current sessions: <span className="font-medium text-foreground">{selectedPlayer?.sessions_attended || 0}/8</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  After marking: <span className="font-medium text-foreground">{((selectedPlayer?.sessions_attended || 0) >= 8 ? 1 : (selectedPlayer?.sessions_attended || 0) + 1)}/8</span>
                </p>
              </div>
              <Button onClick={handleMarkAttendance} className="w-full">
                <UserCheck className="w-4 h-4 mr-2" />
                Mark Attendance
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* History Dialog */}
        <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Attendance History - {selectedPlayerHistory?.child_name}</DialogTitle>
            </DialogHeader>
            <div className="mt-4 max-h-96 overflow-y-auto">
              {selectedPlayerHistory && getPlayerAttendance(selectedPlayerHistory.id).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No attendance records.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Marked At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPlayerHistory && getPlayerAttendance(selectedPlayerHistory.id).map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{new Date(record.session_date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(record.marked_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Player Dialog */}
        <Dialog open={isEditPlayerDialogOpen} onOpenChange={(open) => {
          setIsEditPlayerDialogOpen(open);
          if (!open) {
            setEditingPlayer(null);
            setNewPlayer({ child_name: "", age: "", date_of_birth: undefined, parent_name: "", phone: "", email: "", experience: "" });
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Player</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Child's Name *</Label>
                <Input
                  value={newPlayer.child_name}
                  onChange={(e) => setNewPlayer({ ...newPlayer, child_name: e.target.value })}
                  placeholder="Enter name"
                />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newPlayer.date_of_birth && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newPlayer.date_of_birth ? format(newPlayer.date_of_birth, "PPP") : <span>Select date of birth</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={newPlayer.date_of_birth}
                      onSelect={(date) => setNewPlayer({ ...newPlayer, date_of_birth: date })}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                      captionLayout="dropdown-buttons"
                      fromYear={2005}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Parent Name *</Label>
                <Input
                  value={newPlayer.parent_name}
                  onChange={(e) => setNewPlayer({ ...newPlayer, parent_name: e.target.value })}
                  placeholder="Parent/Guardian name"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={newPlayer.phone}
                  onChange={(e) => setNewPlayer({ ...newPlayer, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={newPlayer.email}
                  onChange={(e) => setNewPlayer({ ...newPlayer, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <Button onClick={handleUpdatePlayer} className="w-full">
                <Edit className="w-4 h-4 mr-2" />
                Update Player
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Attendance Dialog */}
        <Dialog open={isEditAttendanceDialogOpen} onOpenChange={(open) => {
          setIsEditAttendanceDialogOpen(open);
          if (!open) {
            setEditingAttendance(null);
            setEditAttendanceDate("");
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Attendance Date</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Session Date *</Label>
                <Input
                  type="date"
                  value={editAttendanceDate}
                  onChange={(e) => setEditAttendanceDate(e.target.value)}
                />
              </div>
              <Button onClick={handleUpdateAttendance} className="w-full">
                <Edit className="w-4 h-4 mr-2" />
                Update Attendance
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Waiver Dialog */}
        <Dialog open={isWaiverDialogOpen} onOpenChange={setIsWaiverDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Waiver Details - {selectedWaiver?.player_name}</DialogTitle>
            </DialogHeader>
            {selectedWaiver && (
              <div className="mt-4 space-y-6">
                {/* Player Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg text-sm">
                  <div>
                    <span className="text-muted-foreground">Player Name:</span>
                    <p className="font-medium">{selectedWaiver.player_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date of Birth:</span>
                    <p className="font-medium">{selectedWaiver.player_dob}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Parent/Guardian:</span>
                    <p className="font-medium">{selectedWaiver.parent_guardian_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Contact:</span>
                    <p className="font-medium text-xs">{selectedWaiver.phone_email}</p>
                  </div>
                </div>

                {/* Acknowledgments */}
                <div className="space-y-3">
                  <h4 className="font-medium">Acknowledgments</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedWaiver.health_participation ? "default" : "secondary"}>
                        {selectedWaiver.health_participation ? "✓" : "✗"}
                      </Badge>
                      Health & Participation
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedWaiver.emergency_medical ? "default" : "secondary"}>
                        {selectedWaiver.emergency_medical ? "✓" : "✗"}
                      </Badge>
                      Emergency Medical
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedWaiver.concussion_awareness ? "default" : "secondary"}>
                        {selectedWaiver.concussion_awareness ? "✓" : "✗"}
                      </Badge>
                      Concussion Awareness
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedWaiver.media_consent ? "default" : "secondary"}>
                        {selectedWaiver.media_consent ? "✓" : "✗"}
                      </Badge>
                      Media Consent
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-medium">Signatures</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Parent/Guardian Signature</p>
                      <p className="font-medium italic text-lg">{selectedWaiver.parent_signature}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Signed: {format(new Date(selectedWaiver.parent_signed_date), 'MMMM d, yyyy')}
                      </p>
                    </div>
                    {selectedWaiver.player_signature && (
                      <div className="p-4 border rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Player Signature</p>
                        <p className="font-medium italic text-lg">{selectedWaiver.player_signature}</p>
                        {selectedWaiver.player_signed_date && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Signed: {format(new Date(selectedWaiver.player_signed_date), 'MMMM d, yyyy')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground text-center pt-2">
                  Waiver submitted on {format(new Date(selectedWaiver.created_at), 'MMMM d, yyyy \'at\' h:mm a')}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
