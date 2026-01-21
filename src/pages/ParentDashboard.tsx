import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Users, Calendar, DollarSign, User, Mail, Phone, FileText } from "lucide-react";
import { format } from "date-fns";
import { parseDateOnly } from "@/lib/dateOnly";
import { WaiverForm } from "@/components/waiver/WaiverForm";

interface Registration {
  id: string;
  child_name: string;
  age: string;
  date_of_birth: string;
  parent_name: string;
  email: string;
  phone: string;
  experience: string | null;
  sessions_attended: number | null;
  payment_status: string | null;
  created_at: string;
}

interface AttendanceRecord {
  id: string;
  registration_id: string;
  session_date: string;
  notes: string | null;
}

interface PaymentBlock {
  blockNumber: number;
  startDate: string;
  endDate: string;
  sessionsInBlock: number;
  status: 'complete' | 'in_progress' | 'not_started';
}

interface Waiver {
  id: string;
  registration_id: string;
  parent_signature: string;
  parent_signed_date: string;
  player_signature: string | null;
  player_signed_date: string | null;
}

export default function ParentDashboard() {
  const [children, setChildren] = useState<Registration[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [waivers, setWaivers] = useState<Waiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/parent");
      } else {
        setUserEmail(session.user.email || null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/parent");
      } else {
        setUserEmail(session.user.email || null);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (userEmail) {
      fetchData();
    }
  }, [userEmail]);

  const fetchData = async () => {
    if (!userEmail) return;

    setLoading(true);

    // Fetch children registered with this email
    const { data: childrenData, error: childrenError } = await supabase
      .from('registrations')
      .select('*')
      .ilike('email', userEmail);

    if (childrenError) {
      toast({ title: "Error loading data", variant: "destructive" });
      setLoading(false);
      return;
    }

    setChildren(childrenData || []);

    // Fetch attendance records and waivers for all children
    if (childrenData && childrenData.length > 0) {
      const childIds = childrenData.map(c => c.id);
      
      const [attendanceResult, waiversResult] = await Promise.all([
        supabase
          .from('attendance_records')
          .select('*')
          .in('registration_id', childIds)
          .order('session_date', { ascending: false }),
        supabase
          .from('waivers')
          .select('*')
          .in('registration_id', childIds)
      ]);

      setAttendanceRecords(attendanceResult.data || []);
      setWaivers(waiversResult.data || []);
    }

    setLoading(false);
  };

  const getWaiverForChild = (childId: string) => {
    return waivers.find(w => w.registration_id === childId) || null;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/parent");
  };

  const getPaymentBlockHistory = (child: Registration): PaymentBlock[] => {
    const childAttendance = attendanceRecords
      .filter(a => a.registration_id === child.id)
      .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());

    if (childAttendance.length === 0) return [];

    const blocks: PaymentBlock[] = [];
    const totalSessions = child.sessions_attended || 0;
    const totalBlocks = Math.ceil(totalSessions / 8);

    for (let i = 0; i < Math.max(totalBlocks, 1); i++) {
      const startIndex = i * 8;
      const endIndex = Math.min(startIndex + 8, childAttendance.length);
      const blockAttendance = childAttendance.slice(startIndex, endIndex);
      
      if (blockAttendance.length === 0) continue;

      const sessionsInBlock = blockAttendance.length;
      const isComplete = sessionsInBlock >= 8;
      const isCurrentBlock = i === totalBlocks - 1 && !isComplete;

      blocks.push({
        blockNumber: i + 1,
        startDate: blockAttendance[0]?.session_date || '',
        endDate: blockAttendance[blockAttendance.length - 1]?.session_date || '',
        sessionsInBlock,
        status: isComplete ? 'complete' : (isCurrentBlock ? 'in_progress' : 'not_started')
      });
    }

    return blocks.reverse(); // Most recent first
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Parent Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome, {userEmail}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {children.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Children Found</h3>
              <p className="text-muted-foreground">
                No registrations found for {userEmail}. Please contact the coach if you believe this is an error.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="children" className="space-y-6">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="children" className="gap-2">
                <Users className="w-4 h-4" />
                My Children
              </TabsTrigger>
              <TabsTrigger value="waivers" className="gap-2">
                <FileText className="w-4 h-4" />
                Waivers
              </TabsTrigger>
              <TabsTrigger value="attendance" className="gap-2">
                <Calendar className="w-4 h-4" />
                Attendance
              </TabsTrigger>
              <TabsTrigger value="payments" className="gap-2">
                <DollarSign className="w-4 h-4" />
                Payments
              </TabsTrigger>
            </TabsList>

            {/* Children Tab */}
            <TabsContent value="children" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {children.map((child) => (
                  <Card key={child.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        {child.child_name}
                      </CardTitle>
                      <CardDescription>Age: {child.age} years</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        {child.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {child.phone}
                      </div>
                      {child.experience && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Experience: </span>
                          {child.experience}
                        </div>
                      )}
                      <div className="flex items-center gap-4 pt-2">
                        <Badge variant="outline">
                          {child.sessions_attended || 0} sessions attended
                        </Badge>
                        <Badge 
                          variant={child.payment_status === 'paid' ? 'default' : 
                                   child.payment_status === 'pending' ? 'secondary' : 'destructive'}
                        >
                          {child.payment_status || 'pending'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Waivers Tab */}
            <TabsContent value="waivers" className="space-y-4">
              {children.map((child) => (
                <WaiverForm
                  key={child.id}
                  registration={child}
                  existingWaiver={getWaiverForChild(child.id)}
                  onWaiverSigned={fetchData}
                />
              ))}
            </TabsContent>

            {/* Attendance Tab */}
            <TabsContent value="attendance" className="space-y-4">
              {children.map((child) => {
                const childAttendance = attendanceRecords.filter(a => a.registration_id === child.id);
                return (
                  <Card key={child.id}>
                    <CardHeader>
                      <CardTitle>{child.child_name}'s Attendance</CardTitle>
                      <CardDescription>
                        {childAttendance.length} session{childAttendance.length !== 1 ? 's' : ''} recorded
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {childAttendance.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No attendance records yet.</p>
                      ) : (
                        <div className="space-y-2">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Day</TableHead>
                                <TableHead>Notes</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {childAttendance.slice(0, 10).map((record) => (
                                <TableRow key={record.id}>
                                  <TableCell>
                                    {format(parseDateOnly(record.session_date)!, 'MMM d, yyyy')}
                                  </TableCell>
                                  <TableCell>
                                    {format(parseDateOnly(record.session_date)!, 'EEEE')}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {record.notes || '-'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          {childAttendance.length > 10 && (
                            <p className="text-sm text-muted-foreground text-center pt-2">
                              Showing last 10 sessions. Total: {childAttendance.length} sessions.
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-4">
              {children.map((child) => {
                const paymentBlocks = getPaymentBlockHistory(child);
                return (
                  <Card key={child.id}>
                    <CardHeader>
                      <CardTitle>{child.child_name}'s Payment Status</CardTitle>
                      <CardDescription>
                        Sessions are billed in blocks of 8
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Current Status: </span>
                          <Badge 
                            variant={child.payment_status === 'paid' ? 'default' : 
                                     child.payment_status === 'pending' ? 'secondary' : 'destructive'}
                          >
                            {child.payment_status || 'pending'}
                          </Badge>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Total Sessions: </span>
                          <span className="font-medium">{child.sessions_attended || 0}</span>
                        </div>
                      </div>

                      {paymentBlocks.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Payment Block History</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Block</TableHead>
                                <TableHead>Period</TableHead>
                                <TableHead>Sessions</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paymentBlocks.map((block) => (
                                <TableRow key={block.blockNumber}>
                                  <TableCell>Block {block.blockNumber}</TableCell>
                                  <TableCell>
                                    {block.startDate && format(parseDateOnly(block.startDate)!, 'MMM d')} - {' '}
                                    {block.endDate && format(parseDateOnly(block.endDate)!, 'MMM d, yyyy')}
                                  </TableCell>
                                  <TableCell>{block.sessionsInBlock} / 8</TableCell>
                                  <TableCell>
                                    <Badge variant={block.status === 'complete' ? 'default' : 'secondary'}>
                                      {block.status === 'complete' ? 'Complete' : 'In Progress'}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}
