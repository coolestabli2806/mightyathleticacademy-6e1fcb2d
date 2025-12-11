import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin } from "lucide-react";

// Sample schedule data
const weeklySchedule = [
  {
    day: "Monday",
    sessions: [
      { time: "4:00 PM - 5:30 PM", ageGroup: "Ages 5-8", type: "Fundamentals" },
      { time: "5:30 PM - 7:00 PM", ageGroup: "Ages 9-12", type: "Skills Development" },
    ],
  },
  {
    day: "Wednesday",
    sessions: [
      { time: "4:00 PM - 5:30 PM", ageGroup: "Ages 5-8", type: "Fundamentals" },
      { time: "5:30 PM - 7:00 PM", ageGroup: "Ages 9-12", type: "Skills Development" },
    ],
  },
  {
    day: "Thursday",
    sessions: [
      { time: "5:00 PM - 6:30 PM", ageGroup: "Ages 13-16", type: "Advanced Training" },
    ],
  },
  {
    day: "Saturday",
    sessions: [
      { time: "9:00 AM - 10:30 AM", ageGroup: "Ages 5-8", type: "Fun & Games" },
      { time: "10:30 AM - 12:00 PM", ageGroup: "Ages 9-12", type: "Match Practice" },
      { time: "12:00 PM - 1:30 PM", ageGroup: "Ages 13-16", type: "Competitive Training" },
    ],
  },
];

const getTypeColor = (type: string) => {
  switch (type) {
    case "Fundamentals":
      return "success";
    case "Skills Development":
      return "default";
    case "Advanced Training":
      return "pending";
    case "Fun & Games":
      return "warning";
    case "Match Practice":
      return "secondary";
    case "Competitive Training":
      return "destructive";
    default:
      return "default";
  }
};

export default function Schedule() {
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
          <Card className="max-w-2xl mx-auto mb-8 border-none shadow-card">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground">Training Location</h3>
                <p className="text-muted-foreground text-sm">
                  Mighty Athletics Field - 123 Sports Lane, City Park
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {weeklySchedule.map((day) => (
              <Card key={day.day} className="border-none shadow-card overflow-hidden">
                <div className="bg-gradient-hero p-4">
                  <h3 className="font-heading font-bold text-xl text-primary-foreground">
                    {day.day}
                  </h3>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {day.sessions.map((session, index) => (
                      <div 
                        key={index} 
                        className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <div className="flex items-center gap-2 text-muted-foreground min-w-[140px]">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">{session.time}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{session.ageGroup}</p>
                          <Badge variant={getTypeColor(session.type) as any} className="mt-1">
                            {session.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payment Info */}
          <Card className="max-w-2xl mx-auto mt-12 border-none shadow-card bg-accent/10">
            <CardContent className="p-6 text-center">
              <h3 className="font-heading font-bold text-xl text-foreground mb-2">
                Payment Information
              </h3>
              <p className="text-muted-foreground">
                Sessions are billed in blocks of 4. Payment is due before the first session of each block.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
}
