import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, Calendar, DollarSign, CheckCircle, 
  LogOut, Plus, Search, MoreVertical, 
  UserCheck, Clock, AlertCircle
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

// Sample data
const initialKids = [
  { id: 1, name: "Alex Johnson", age: 10, parent: "Sarah Johnson", phone: "(555) 111-2222", email: "sarah@email.com", sessions: 3, paid: true },
  { id: 2, name: "Emma Williams", age: 8, parent: "Mike Williams", phone: "(555) 333-4444", email: "mike@email.com", sessions: 2, paid: true },
  { id: 3, name: "Lucas Brown", age: 12, parent: "Lisa Brown", phone: "(555) 555-6666", email: "lisa@email.com", sessions: 4, paid: false },
  { id: 4, name: "Sophia Davis", age: 9, parent: "Tom Davis", phone: "(555) 777-8888", email: "tom@email.com", sessions: 1, paid: true },
  { id: 5, name: "Noah Miller", age: 11, parent: "Amy Miller", phone: "(555) 999-0000", email: "amy@email.com", sessions: 0, paid: false },
];

const scheduleData = [
  { day: "Monday", time: "4:00 PM", ageGroup: "5-8", type: "Fundamentals" },
  { day: "Monday", time: "5:30 PM", ageGroup: "9-12", type: "Skills" },
  { day: "Wednesday", time: "4:00 PM", ageGroup: "5-8", type: "Fundamentals" },
  { day: "Wednesday", time: "5:30 PM", ageGroup: "9-12", type: "Skills" },
  { day: "Saturday", time: "9:00 AM", ageGroup: "5-8", type: "Games" },
  { day: "Saturday", time: "10:30 AM", ageGroup: "9-12", type: "Match" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [kids, setKids] = useState(initialKids);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newKid, setNewKid] = useState({
    name: "", age: "", parent: "", phone: "", email: ""
  });

  useEffect(() => {
    // Check if admin is logged in (temporary - will be replaced with Supabase)
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) {
      navigate("/admin");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    toast({ title: "Logged out successfully" });
    navigate("/admin");
  };

  const filteredKids = kids.filter(kid => 
    kid.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    kid.parent.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddKid = () => {
    if (!newKid.name || !newKid.age || !newKid.parent) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    const kid = {
      id: kids.length + 1,
      ...newKid,
      age: parseInt(newKid.age),
      sessions: 0,
      paid: false,
    };
    setKids([...kids, kid]);
    setNewKid({ name: "", age: "", parent: "", phone: "", email: "" });
    setIsAddDialogOpen(false);
    toast({ title: "Player added successfully!" });
  };

  const handleMarkAttendance = (kidId: number) => {
    setKids(kids.map(kid => {
      if (kid.id === kidId) {
        const newSessions = kid.sessions + 1;
        const needsPayment = newSessions >= 4;
        return { 
          ...kid, 
          sessions: newSessions >= 4 ? 0 : newSessions,
          paid: needsPayment ? false : kid.paid
        };
      }
      return kid;
    }));
    toast({ title: "Attendance marked!" });
  };

  const handleTogglePayment = (kidId: number) => {
    setKids(kids.map(kid => 
      kid.id === kidId ? { ...kid, paid: !kid.paid } : kid
    ));
    const kid = kids.find(k => k.id === kidId);
    toast({ title: kid?.paid ? "Marked as pending" : "Marked as paid" });
  };

  const handleDeleteKid = (kidId: number) => {
    setKids(kids.filter(kid => kid.id !== kidId));
    toast({ title: "Player removed" });
  };

  const stats = {
    totalKids: kids.length,
    paidKids: kids.filter(k => k.paid).length,
    pendingKids: kids.filter(k => !k.paid).length,
    sessionsThisWeek: 6,
  };

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-xl text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Elite Soccer Academy</p>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
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
                  <p className="font-heading font-bold text-2xl text-foreground">{stats.totalKids}</p>
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
                  <p className="font-heading font-bold text-2xl text-foreground">{stats.paidKids}</p>
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
                  <p className="font-heading font-bold text-2xl text-foreground">{stats.pendingKids}</p>
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
                            value={newKid.name}
                            onChange={(e) => setNewKid({ ...newKid, name: e.target.value })}
                            placeholder="Enter name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Age *</Label>
                          <Select
                            value={newKid.age}
                            onValueChange={(value) => setNewKid({ ...newKid, age: value })}
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
                            value={newKid.parent}
                            onChange={(e) => setNewKid({ ...newKid, parent: e.target.value })}
                            placeholder="Parent/Guardian name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input
                            value={newKid.phone}
                            onChange={(e) => setNewKid({ ...newKid, phone: e.target.value })}
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            value={newKid.email}
                            onChange={(e) => setNewKid({ ...newKid, email: e.target.value })}
                            placeholder="email@example.com"
                          />
                        </div>
                        <Button onClick={handleAddKid} className="w-full">
                          Add Player
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
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
                    {filteredKids.map((kid) => (
                      <TableRow key={kid.id}>
                        <TableCell className="font-medium">{kid.name}</TableCell>
                        <TableCell>{kid.age}</TableCell>
                        <TableCell>{kid.parent}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{kid.phone}</p>
                            <p className="text-muted-foreground">{kid.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4].map((s) => (
                                <div
                                  key={s}
                                  className={`w-3 h-3 rounded-full ${s <= kid.sessions ? 'bg-primary' : 'bg-border'}`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-muted-foreground">{kid.sessions}/4</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={kid.paid ? "success" : "pending"}>
                            {kid.paid ? "Paid" : "Pending"}
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
                              <DropdownMenuItem onClick={() => handleMarkAttendance(kid.id)}>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Mark Attendance
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleTogglePayment(kid.id)}>
                                <DollarSign className="w-4 h-4 mr-2" />
                                Toggle Payment
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteKid(kid.id)}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {kids.map((kid) => (
                    <Card key={kid.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">{kid.name}</p>
                            <p className="text-sm text-muted-foreground">Age {kid.age}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex gap-0.5 justify-end mb-2">
                              {[1, 2, 3, 4].map((s) => (
                                <div
                                  key={s}
                                  className={`w-4 h-4 rounded-full ${s <= kid.sessions ? 'bg-primary' : 'bg-border'}`}
                                />
                              ))}
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => handleMarkAttendance(kid.id)}
                              disabled={kid.sessions >= 4 && !kid.paid}
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Mark
                            </Button>
                          </div>
                        </div>
                        {kid.sessions >= 4 && !kid.paid && (
                          <div className="mt-3 p-2 bg-pending/10 rounded-lg flex items-center gap-2 text-sm text-pending">
                            <AlertCircle className="w-4 h-4" />
                            Payment required for next cycle
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Sessions Completed</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kids.map((kid) => (
                      <TableRow key={kid.id}>
                        <TableCell className="font-medium">{kid.name}</TableCell>
                        <TableCell>{kid.parent}</TableCell>
                        <TableCell>{kid.sessions}/4</TableCell>
                        <TableCell>
                          <Badge variant={kid.paid ? "success" : "pending"}>
                            {kid.paid ? "Paid" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant={kid.paid ? "outline" : "default"}
                            onClick={() => handleTogglePayment(kid.id)}
                          >
                            {kid.paid ? "Mark Pending" : "Mark Paid"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <Card className="border-none shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Weekly Schedule</CardTitle>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Session
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Age Group</TableHead>
                      <TableHead>Session Type</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduleData.map((session, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{session.day}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            {session.time}
                          </div>
                        </TableCell>
                        <TableCell>Ages {session.ageGroup}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{session.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
