import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, Calendar, DollarSign, CheckCircle, 
  LogOut, Plus, Search, MoreVertical, 
  UserCheck, Clock, AlertCircle, RefreshCw, Trash2, Edit
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
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIMES = ['8:00 AM', '9:00 AM', '10:00 AM', '10:30 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM'];
const AGE_GROUPS = ['5-8', '9-12', '13-16', 'All Ages'];
const SESSION_TYPES = ['Fundamentals', 'Skills', 'Games', 'Match', 'Training', 'Practice'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Registration[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [newPlayer, setNewPlayer] = useState({
    child_name: "", age: "", parent_name: "", phone: "", email: "", experience: ""
  });
  const [newSchedule, setNewSchedule] = useState({
    day: "", time: "", age_group: "", session_type: ""
  });

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) {
      navigate("/admin");
    } else {
      fetchPlayers();
      fetchSchedules();
    }
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
      .select('*')
      .order('day', { ascending: true });

    if (error) {
      console.error('Error fetching schedules:', error);
    } else {
      setSchedules(data || []);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
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

  const handleMarkAttendance = async (playerId: string, currentSessions: number) => {
    const newSessions = currentSessions >= 4 ? 1 : currentSessions + 1;
    const needsPayment = currentSessions >= 3;
    
    const { error } = await supabase
      .from('registrations')
      .update({ 
        sessions_attended: newSessions,
        payment_status: needsPayment ? 'pending' : undefined
      })
      .eq('id', playerId);

    if (error) {
      toast({ title: "Error marking attendance", variant: "destructive" });
    } else {
      // Also record in attendance_records
      await supabase.from('attendance_records').insert({
        registration_id: playerId,
        session_date: new Date().toISOString().split('T')[0]
      });
      toast({ title: "Attendance marked!" });
      fetchPlayers();
    }
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
    });

    if (error) {
      toast({ title: "Error adding session", variant: "destructive" });
    } else {
      setNewSchedule({ day: "", time: "", age_group: "", session_type: "" });
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
      })
      .eq('id', editingSchedule.id);

    if (error) {
      toast({ title: "Error updating session", variant: "destructive" });
    } else {
      setNewSchedule({ day: "", time: "", age_group: "", session_type: "" });
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

  const openEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setNewSchedule({
      day: schedule.day,
      time: schedule.time,
      age_group: schedule.age_group,
      session_type: schedule.session_type,
    });
    setIsScheduleDialogOpen(true);
  };

  const openAddSchedule = () => {
    setEditingSchedule(null);
    setNewSchedule({ day: "", time: "", age_group: "", session_type: "" });
    setIsScheduleDialogOpen(true);
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
          <TabsList className="bg-card p-1">
            <TabsTrigger value="players" className="gap-2">
              <Users className="w-4 h-4" />
              Players
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-2">
              <UserCheck className="w-4 h-4" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <DollarSign className="w-4 h-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <Calendar className="w-4 h-4" />
              Schedule
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
                                {[1, 2, 3, 4].map((s) => (
                                  <div
                                    key={s}
                                    className={`w-3 h-3 rounded-full ${s <= player.sessions_attended ? 'bg-primary' : 'bg-border'}`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-muted-foreground">{player.sessions_attended}/4</span>
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
                                <DropdownMenuItem onClick={() => handleMarkAttendance(player.id, player.sessions_attended)}>
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
                                {[1, 2, 3, 4].map((s) => (
                                  <div
                                    key={s}
                                    className={`w-4 h-4 rounded-full ${s <= player.sessions_attended ? 'bg-primary' : 'bg-border'}`}
                                  />
                                ))}
                              </div>
                              <Button 
                                size="sm" 
                                variant={player.sessions_attended >= 4 ? "outline" : "default"}
                                onClick={() => handleMarkAttendance(player.id, player.sessions_attended)}
                              >
                                <UserCheck className="w-4 h-4 mr-1" />
                                Mark
                              </Button>
                            </div>
                          </div>
                          {player.sessions_attended >= 4 && (
                            <div className="mt-3 pt-3 border-t flex items-center gap-2 text-pending">
                              <AlertCircle className="w-4 h-4" />
                              <span className="text-sm">Payment due</span>
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
                              <p className="text-sm text-muted-foreground">{player.parent_name} • {player.sessions_attended}/4 sessions</p>
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
        </Tabs>
      </main>
    </div>
  );
}
