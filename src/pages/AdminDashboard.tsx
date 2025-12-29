import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, Calendar, DollarSign, CheckCircle, 
  LogOut, Plus, Search, MoreVertical, 
  UserCheck, Clock, AlertCircle, RefreshCw, Trash2, Edit, MapPin,
  Camera, Heart, History
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
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Textarea } from "@/components/ui/textarea";

interface Registration {
  id: string;
  child_name: string;
  age: string;
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

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIMES = ['8:00 AM', '9:00 AM', '10:00 AM', '10:30 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM'];
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
    child_name: "", age: "", parent_name: "", phone: "", email: "", experience: ""
  });
  const [newSchedule, setNewSchedule] = useState({
    day: "", time: "", age_group: "", session_type: "", location_id: ""
  });
  const [newLocation, setNewLocation] = useState({ name: "", address: "" });

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
    if (!newPlayer.child_name || !newPlayer.age || !newPlayer.parent_name) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    
    const { error } = await supabase.from('registrations').insert({
      child_name: newPlayer.child_name,
      age: newPlayer.age,
      parent_name: newPlayer.parent_name,
      phone: newPlayer.phone,
      email: newPlayer.email,
      experience: newPlayer.experience || null,
    });

    if (error) {
      toast({ title: "Error adding player", variant: "destructive" });
    } else {
      setNewPlayer({ child_name: "", age: "", parent_name: "", phone: "", email: "", experience: "" });
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
    
    // Upload file to storage
    const fileExt = galleryFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(fileName, galleryFile);

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
                          <Label>Age *</Label>
                          <Select
                            value={newPlayer.age}
                            onValueChange={(value) => setNewPlayer({ ...newPlayer, age: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select age" />
                            </SelectTrigger>
                            <SelectContent>
                              {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((age) => (
                                <SelectItem key={age} value={age.toString()}>{age} years</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                          {/* Attendance History */}
                          {getPlayerAttendance(player.id).length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs text-muted-foreground mb-2">Recent attendance:</p>
                              <div className="flex flex-wrap gap-1">
                                {getPlayerAttendance(player.id).slice(0, 5).map((record) => (
                                  <Badge key={record.id} variant="outline" className="text-xs">
                                    {new Date(record.session_date).toLocaleDateString()}
                                  </Badge>
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
      </main>
    </div>
  );
}
