import { Users, Target, Clock, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Users,
    title: "Small Group Training",
    description: "Personalized attention with small group sizes to maximize skill development.",
  },
  {
    icon: Target,
    title: "Professional Coaching",
    description: "Experienced coaches using proven techniques to build fundamentals.",
  },
  {
    icon: Clock,
    title: "Flexible Schedule",
    description: "Multiple weekly sessions to fit your family's busy schedule.",
  },
  {
    icon: Shield,
    title: "Safe Environment",
    description: "Age-appropriate training in a supportive and encouraging atmosphere.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Choose Our Academy?
          </h2>
          <p className="text-muted-foreground">
            We're committed to developing well-rounded athletes who excel both on and off the field.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={feature.title}
              className="group hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border-none bg-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center mb-4 group-hover:shadow-glow transition-shadow duration-300">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
