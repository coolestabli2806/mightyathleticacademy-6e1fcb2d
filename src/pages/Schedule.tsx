import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Location {
  name: string;
  address: string | null;
}

interface Schedule {
  id: string;
  day: string;
  time: string;
  age_group: string;
  session_type: string;
  location_id: string | null;
  locations: Location | null;
}

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getTypeColor = (type: string) => {
  switch (type) {
    case "Fundamentals":
      return "success";
    case "Skills":
      return "default";
    case "Training":
      return "pending";
    case "Games":
      return "warning";
    case "Match":
      return "secondary";
    case "Practice":
      return "destructive";
    default:
      return "default";
  }
};

export default function Schedule() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    const { data, error } = await supabase
      .from('schedules')
      .select('*, locations(name, address)');

    if (error) {
      console.error('Error fetching schedules:', error);
    } else {
      setSchedules(data || []);
    }
    setLoading(false);
  };

  // Group schedules by day
  const schedulesByDay = schedules.reduce((acc, schedule) => {
    if (!acc[schedule.day]) {
      acc[schedule.day] = [];
    }
    acc[schedule.day].push(schedule);
    return acc;
  }, {} as Record<string, Schedule[]>);

  // Sort days and sessions
  const sortedDays = Object.keys(schedulesByDay).sort(
    (a, b) => DAYS_ORDER.indexOf(a) - DAYS_ORDER.indexOf(b)
  );

  // Get unique locations from schedules
  const uniqueLocations = [...new Set(schedules
    .filter(s => s.locations)
    .map(s => s.locations?.name)
  )].filter(Boolean);

  return (
    <Layout>
      <section className="py-20 bg-secondary min-h-screen">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Weekly Schedule</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Training Schedule
            </h1>
            <p className="text-muted-foreground">
              Check out our weekly training schedule below. Sessions are organized by age group 
              and skill level.
            </p>
          </div>

          {/* Location Info */}
          {uniqueLocations.length > 0 && (
            <Card className="max-w-2xl mx-auto mb-8 border-none shadow-card">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">Training Locations</h3>
                    <p className="text-muted-foreground text-sm">
                      {uniqueLocations.join(' / ')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schedule Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : sortedDays.length === 0 ? (
            <Card className="max-w-2xl mx-auto border-none shadow-card">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Schedule coming soon. Please check back later!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {sortedDays.map((day) => (
                <Card key={day} className="border-none shadow-card overflow-hidden">
                  <div className="bg-gradient-hero p-4">
                    <h3 className="font-heading font-bold text-xl text-primary-foreground">
                      {day}
                    </h3>
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {schedulesByDay[day].map((session) => (
                        <div 
                          key={session.id} 
                          className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                        >
                          <div className="flex items-center gap-2 text-muted-foreground min-w-[100px]">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">{session.time}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">Ages {session.age_group}</p>
                            <Badge variant={getTypeColor(session.session_type) as any} className="mt-1">
                              {session.session_type}
                            </Badge>
                            {session.locations && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                                <MapPin className="w-3 h-3" />
                                {session.locations.name}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Payment Info */}
          <Card className="max-w-2xl mx-auto mt-12 border-none shadow-card bg-accent/10">
            <CardContent className="p-6 text-center">
              <h3 className="font-heading font-bold text-xl text-foreground mb-2">
                Payment Information
              </h3>
              <p className="text-muted-foreground">
                Sessions are billed in blocks of 8. Payment is due before the first session of each block.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
}